using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Entities;
using ChitStack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Hangfire;

namespace ChitStack.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly TenantDbContext _context;
    private readonly INotificationsHubService _hubService;
    private readonly ILogger<NotificationService> _logger;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly IHttpClientFactory _httpClientFactory;

    public NotificationService(
        TenantDbContext context, 
        INotificationsHubService hubService,
        ILogger<NotificationService> logger,
        IBackgroundJobClient backgroundJobClient,
        IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _hubService = hubService;
        _logger = logger;
        _backgroundJobClient = backgroundJobClient;
        _httpClientFactory = httpClientFactory;
    }

    public async Task SendMemberNotificationAsync(int memberId, string title, string message, NotificationType type = NotificationType.Info, NotificationChannels? channels = null)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.MemberId == memberId);
        if (user != null)
        {
            await SendNotificationAsync(user.Id, title, message, type, null, channels);
        }
        else
        {
            // Member has no portal account — save log and dispatch external channels using Member prefs
            await SaveSystemNotificationEntryAsync(null, memberId, title, message, type, null, null, channels);
            
            var member = await _context.Members.AsNoTracking().FirstOrDefaultAsync(m => m.Id == memberId);
            bool wa = member?.WhatsAppEnabled ?? false;
            bool s = member?.SmsEnabled ?? false;
            bool em = member?.EmailEnabled ?? false;

            _backgroundJobClient.Enqueue(() => DispatchExternalNotificationsForMemberAsync(memberId, title, message, channels, wa, s, em));
        }
    }

    public async Task SendNotificationAsync(int userId, string title, string message, NotificationType type = NotificationType.Info, string? actionUrl = null, NotificationChannels? channels = null)
    {
        var userSettings = await GetOrCreateUserSettingsAsync(userId);
        var user = await _context.Users.Include(u => u.Member).FirstOrDefaultAsync(u => u.Id == userId);
        int? memberId = user?.MemberId;

        // Save the activity record (regardless of in-portal toggle) for administrative log
        await SaveSystemNotificationEntryAsync(userId, memberId, title, message, type, actionUrl, null, channels);

        if (channels?.InPortal ?? userSettings.InPortalEnabled)
        {
            var notification = await _context.Notifications.OrderByDescending(x => x.CreatedAt).FirstOrDefaultAsync(x => x.UserId == userId);
            if (notification != null) await _hubService.PushNotificationAsync(userId, notification);
        }

        // Background external channels using UserNotificationSetting prefs
        bool sendWhatsApp = channels?.WhatsApp ?? userSettings.WhatsAppEnabled;
        bool sendSms = channels?.SMS ?? userSettings.SmsEnabled;
        bool sendEmail = channels?.Email ?? userSettings.EmailEnabled;
        int targetMemberId = memberId ?? 0;
        _backgroundJobClient.Enqueue(() => DispatchExternalNotificationsForMemberAsync(
            targetMemberId, title, message, channels, sendWhatsApp, sendSms, sendEmail));
    }

    [Queue("tenant-notifications")]
    public async Task DispatchExternalNotificationsForMemberAsync(int memberId, string title, string message, NotificationChannels? channels, bool? prefWhatsApp = true, bool? prefSms = true, bool? prefEmail = true)
    {
        if (memberId <= 0) return;
        
        // If preferences weren't passed (e.g. background job without full context), fetch them
        if (prefWhatsApp == null)
        {
            var member = await _context.Members.AsNoTracking().FirstOrDefaultAsync(m => m.Id == memberId);
            if (member != null)
            {
                prefWhatsApp = member.WhatsAppEnabled;
                prefSms = member.SmsEnabled;
                prefEmail = member.EmailEnabled;
            }
        }

        if (channels?.WhatsApp ?? (prefWhatsApp == true)) await SendWhatsAppAsync(null, memberId, title, message);
        if (channels?.SMS ?? (prefSms == true)) await SendSmsAsync(null, memberId, title, message);
        if (channels?.Email ?? (prefEmail == true)) await SendEmailAsync(null, memberId, title, message);
    }
    
    private async Task SendWhatsAppAsync(int? userId, int? memberId, string title, string message)
    {
        var tenantSettings = await _context.TenantSettings.AsNoTracking().FirstOrDefaultAsync();
        if (tenantSettings == null || string.IsNullOrEmpty(tenantSettings.WhatsAppApiUrl))
        {
            _logger.LogWarning("WhatsApp configuration missing in TenantSettings. Skipping.");
            return;
        }

        string? phoneNumber = null;
        if (memberId.HasValue && memberId.Value > 0)
        {
            phoneNumber = await _context.Members
                .Where(m => m.Id == memberId.Value)
                .Select(m => m.PhoneNumber)
                .FirstOrDefaultAsync();
        }
        else if (userId.HasValue && userId.Value > 0)
        {
            phoneNumber = await _context.Users
                .Where(u => u.Id == userId.Value)
                .Include(u => u.Member)
                .Select(u => u.Member != null ? u.Member.PhoneNumber : null)
                .FirstOrDefaultAsync();
        }

        if (string.IsNullOrEmpty(phoneNumber))
        {
            _logger.LogWarning("Subscriber phone number not found for User {UserId}/Member {MemberId}. Skipping WhatsApp.", userId, memberId);
            return;
        }

        // Clean phone number (remove +, spaces, etc.)
        phoneNumber = new string(phoneNumber.Where(char.IsDigit).ToArray());
        if (!phoneNumber.StartsWith("91") && phoneNumber.Length == 10) phoneNumber = "91" + phoneNumber; // Default to India if 10 digits

        try
        {
            var client = _httpClientFactory.CreateClient();
            
            // Meta Graph API / WhatsApp Business Platform format
            // We assume WhatsAppApiUrl is something like: https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages
            // And WhatsAppApiKey is the Permanent Access Token.
            
            var payload = new
            {
                messaging_product = "whatsapp",
                recipient_type = "individual",
                to = phoneNumber,
                type = "text",
                text = new { body = $"{title}\n\n{message}" }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, tenantSettings.WhatsAppApiUrl);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tenantSettings.WhatsAppApiKey);
            request.Content = new StringContent(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("WhatsApp notification sent successfully to {PhoneNumber}", phoneNumber);
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to send WhatsApp to {PhoneNumber}. Status: {Status}, Error: {Error}", phoneNumber, response.StatusCode, error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while sending WhatsApp notification to {PhoneNumber}", phoneNumber);
        }
    }

    public async Task SendPaymentReminderAsync(int userId, decimal amount, DateTime dueDate)
    {
        var user = await _context.Users.Include(u => u.Member).ThenInclude(m => m!.Tickets).ThenInclude(t => t.ChitGroup)
            .FirstOrDefaultAsync(u => u.Id == userId);

        var chitGroupName = user?.Member?.Tickets?.FirstOrDefault()?.ChitGroup?.GroupName ?? "your chit group";

        var placeholders = new Dictionary<string, string>
        {
            { "ChitGroup", chitGroupName },
            { "Amount", amount.ToString("N2") },
            { "DueDate", dueDate.ToString("dd MMM yyyy") }
        };

        await SendUserTemplatedNotificationAsync(userId, "Payment Reminders", placeholders);
    }

    public async Task SendAuctionReminderAsync(int userId, string groupName, DateTime auctionDate)
    {
        var hoursUntil = Math.Round((auctionDate - DateTime.Now).TotalHours, 0).ToString("0");

        var placeholders = new Dictionary<string, string>
        {
            { "ChitGroup", groupName },
            { "Hours", hoursUntil }
        };

        await SendUserTemplatedNotificationAsync(userId, "Auction Alerts", placeholders);
    }

    public Task BroadcastCustomNotificationAsync(
        List<int>? userIds, List<int>? memberIds, string? userRole, bool? allMembers,
        string title, string message, NotificationType type, string? actionUrl, NotificationChannels? channels)
    {
        _backgroundJobClient.Enqueue(() => ProcessBroadcastAsync(userIds, memberIds, userRole, allMembers, title, message, type, actionUrl, channels));
        return Task.CompletedTask;
    }

    [Queue("tenant-notifications")]
    [AutomaticRetry(Attempts = 2)]
    public async Task ProcessBroadcastAsync(
        List<int>? userIds, List<int>? memberIds, string? userRole, bool? allMembers,
        string title, string message, NotificationType type, string? actionUrl, NotificationChannels? channels)
    {
        if (userIds != null && userIds.Any())
        {
            foreach (var userId in userIds)
                await SendNotificationAsync(userId, title, message, type, actionUrl, channels);
        }

        if (memberIds != null && memberIds.Any())
        {
            foreach (var memberId in memberIds)
                await SendMemberNotificationAsync(memberId, title, message, type, channels);
        }

        if (!string.IsNullOrEmpty(userRole))
        {
            var usersInRole = await _context.Users
                .Where(u => u.Role == userRole)
                .Select(u => u.Id)
                .ToListAsync();

            foreach (var userId in usersInRole)
                await SendNotificationAsync(userId, title, message, type, actionUrl, channels);
        }

        if (allMembers == true)
        {
            var allMemberIds = await _context.Members.Select(m => m.Id).ToListAsync();
            foreach (var memberId in allMemberIds)
                await SendMemberNotificationAsync(memberId, title, message, type, channels);
        }
    }

    public async Task<UserNotificationSetting> GetUserSettingsAsync(int userId)
    {
        return await GetOrCreateUserSettingsAsync(userId);
    }

    public async Task UpdateUserSettingsAsync(UserNotificationSetting settings)
    {
        _context.UserNotificationSettings.Update(settings);
        await _context.SaveChangesAsync();
    }

    private async Task<UserNotificationSetting> GetOrCreateUserSettingsAsync(int userId)
    {
        var settings = await _context.UserNotificationSettings.FirstOrDefaultAsync(x => x.UserId == userId);
        if (settings == null)
        {
            settings = new UserNotificationSetting { UserId = userId };
            _context.UserNotificationSettings.Add(settings);
            await _context.SaveChangesAsync();
        }
        return settings;
    }

    [Queue("tenant-default")]
    public async Task SendTemplatedNotificationAsync(int memberId, string templateName, Dictionary<string, string> placeholders)
    {
        // Background the entire templating and sending process
        _backgroundJobClient.Enqueue(() => ProcessAndSendTemplatedNotificationAsync(memberId, templateName, placeholders));
    }

    [Queue("tenant-default")]
    public async Task SendUserTemplatedNotificationAsync(int userId, string templateName, Dictionary<string, string> placeholders)
    {
        _backgroundJobClient.Enqueue(() => ProcessAndSendUserTemplatedNotificationAsync(userId, templateName, placeholders));
    }

    [Queue("tenant-notifications")]
    [AutomaticRetry(Attempts = 2)]
    public async Task ProcessAndSendTemplatedNotificationAsync(int memberId, string templateName, Dictionary<string, string> placeholders)
    {
        var content = await ProcessTemplateAsync(templateName, placeholders);
        if (content != null)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.MemberId == memberId);
            if (user != null)
            {
                await SendUniversalNotificationAsync(user.Id, content, NotificationType.Info, null, null);
            }
            else
            {
                // Dispatch only external (member has no account/portal)
                _backgroundJobClient.Enqueue(() => SendExternalOnlyNotificationAsync(null, memberId, content, null));
            }
        }
    }

    [Queue("tenant-notifications")]
    [AutomaticRetry(Attempts = 2)]
    public async Task ProcessAndSendUserTemplatedNotificationAsync(int userId, string templateName, Dictionary<string, string> placeholders)
    {
        var content = await ProcessTemplateAsync(templateName, placeholders);
        if (content != null)
        {
            await SendUniversalNotificationAsync(userId, content, NotificationType.Info, null, null);
        }
    }

    private async Task SendUniversalNotificationAsync(int userId, TemplatedContent content, NotificationType type, string? actionUrl, NotificationChannels? channels)
    {
        var userSettings = await GetOrCreateUserSettingsAsync(userId);
        var user = await _context.Users.Include(u => u.Member).FirstOrDefaultAsync(u => u.Id == userId);
        int? memberId = user?.MemberId;

        // Save log
        await SaveSystemNotificationEntryAsync(userId, memberId, content.Title, content.Message, type, actionUrl, content.TemplateName, channels);

        // SignalR — respect user's in-portal setting
        if (channels?.InPortal ?? userSettings.InPortalEnabled)
        {
            var notification = await _context.Notifications.OrderByDescending(x => x.CreatedAt).FirstOrDefaultAsync(x => x.UserId == userId);
            if (notification != null) await _hubService.PushNotificationAsync(userId, notification);
        }

        // Background external channels using UserNotificationSetting prefs
        bool sendWhatsApp = channels?.WhatsApp ?? userSettings.WhatsAppEnabled;
        bool sendSms = channels?.SMS ?? userSettings.SmsEnabled;
        bool sendEmail = channels?.Email ?? userSettings.EmailEnabled;
        int targetMemberId = memberId ?? 0;
        _backgroundJobClient.Enqueue(() => DispatchExternalNotificationsForMemberAsync(
            targetMemberId, content.Title, content.WhatsApp ?? content.Message, channels, sendWhatsApp, sendSms, sendEmail));
    }

    [Queue("tenant-notifications")]
    public async Task SendExternalOnlyNotificationAsync(int? userId, int memberId, TemplatedContent content, NotificationChannels? channels)
    {
        var member = await _context.Members.AsNoTracking().FirstOrDefaultAsync(m => m.Id == memberId);
        bool wa = member?.WhatsAppEnabled ?? true;
        bool s = member?.SmsEnabled ?? true;
        bool em = member?.EmailEnabled ?? true;

        if (channels?.WhatsApp ?? wa) await SendWhatsAppAsync(userId, memberId, content.Title, content.WhatsApp ?? content.Message);
        if (channels?.SMS ?? s) await SendSmsAsync(userId, memberId, content.Title, content.Sms ?? content.Message);
        if (channels?.Email ?? em) await SendEmailAsync(userId, memberId, content.Title, content.Email ?? content.Message);
    }

    private async Task<TemplatedContent?> ProcessTemplateAsync(string templateName, Dictionary<string, string> placeholders)
    {
        var settings = await _context.TenantSettings.AsNoTracking().FirstOrDefaultAsync();
        if (settings == null) return null;

        bool isEnabled = templateName switch
        {
            "ReceiptConfirmation" => settings.NotifyOnReceipt,
            "AuctionWinner" => settings.NotifyOnAuctionWon,
            "DividendCredit" => settings.NotifyOnDividend,
            "DemandAlert" => settings.NotifyOnDemand,
            "ReconciliationApproval" => settings.NotifyOnReconciliation,
            "PayoutDisbursement" => settings.NotifyOnPayout,
            _ => true
        };

        if (!isEnabled) return null;

        var template = await _context.NotificationTemplates.AsNoTracking().FirstOrDefaultAsync(t => t.Name == templateName);
        if (template == null || !template.IsEnabled) return null;

        var result = new TemplatedContent
        {
            Title = ReplacePlaceholders(template.TitleTemplate, placeholders),
            Message = ReplacePlaceholders(template.MessageTemplate, placeholders),
            WhatsApp = ReplacePlaceholders(template.WhatsAppTemplate, placeholders),
            Sms = ReplacePlaceholders(template.SmsTemplate, placeholders),
            Email = ReplacePlaceholders(template.EmailHtmlTemplate, placeholders),
            TemplateName = templateName
        };

        return result;
    }

    private string ReplacePlaceholders(string? template, Dictionary<string, string> placeholders)
    {
        if (string.IsNullOrEmpty(template)) return string.Empty;
        var result = template;
        foreach (var placeholder in placeholders)
        {
            result = result.Replace($"{{{placeholder.Key}}}", placeholder.Value);
        }
        return result;
    }

    private async Task SaveSystemNotificationEntryAsync(int? userId, int? memberId, string title, string message, NotificationType type, string? actionUrl, string? templateName, NotificationChannels? channels)
    {
        var sentChannels = new List<string>();
        if (channels?.InPortal == true) sentChannels.Add("Portal");
        if (channels?.WhatsApp == true) sentChannels.Add("WhatsApp");
        if (channels?.SMS == true) sentChannels.Add("SMS");
        if (channels?.Email == true) sentChannels.Add("Email");

        var record = new Notification
        {
            UserId = userId,
            MemberId = memberId,
            Title = title,
            Message = message,
            Type = type,
            ActionUrl = actionUrl,
            TemplateName = templateName ?? title, // Fallback to title
            ChannelsSent = string.Join(", ", sentChannels),
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };

        _context.Notifications.Add(record);
        await _context.SaveChangesAsync();
    }

    public class TemplatedContent
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty; // Default/In-Portal
        public string? WhatsApp { get; set; }
        public string? Sms { get; set; }
        public string? Email { get; set; }
        public string? TemplateName { get; set; }
    }

    private async Task SendSmsAsync(int? userId, int? memberId, string title, string message)
    {
        _logger.LogInformation("Background Sending SMS to User {UserId}/Member {MemberId}: {Message}", userId, memberId, message);
        await Task.CompletedTask;
    }

    private async Task SendEmailAsync(int? userId, int? memberId, string title, string message)
    {
        _logger.LogInformation("Background Sending Email to User {UserId}/Member {MemberId}: {Message}", userId, memberId, message);
        await Task.CompletedTask;
    }
}
