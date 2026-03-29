using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Entities;
using ChitLedger.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Hangfire;

namespace ChitLedger.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly TenantDbContext _context;
    private readonly INotificationsHubService _hubService;
    private readonly ILogger<NotificationService> _logger;
    private readonly IBackgroundJobClient _backgroundJobClient;

    public NotificationService(
        TenantDbContext context, 
        INotificationsHubService hubService,
        ILogger<NotificationService> logger,
        IBackgroundJobClient backgroundJobClient)
    {
        _context = context;
        _hubService = hubService;
        _logger = logger;
        _backgroundJobClient = backgroundJobClient;
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
            // If no user exists, we still background the external senders for this member
            _backgroundJobClient.Enqueue(() => DispatchExternalNotificationsForMemberAsync(memberId, title, message, channels));
        }
    }

    public async Task SendNotificationAsync(int userId, string title, string message, NotificationType type = NotificationType.Info, string? actionUrl = null, NotificationChannels? channels = null)
    {
        var settings = await GetUserSettingsAsync(userId);
        
        // 1. In-Portal Notification (Keep this synchronous for instant UI update)
        bool sendInPortal = channels?.InPortal ?? settings.InPortalEnabled;
        if (sendInPortal)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                ActionUrl = actionUrl,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            
            // Push via SignalR
            await _hubService.PushNotificationAsync(userId, notification);
        }
        
        // 2. Background all External Channels
        _backgroundJobClient.Enqueue(() => DispatchExternalNotificationsAsync(userId, title, message, settings, channels));
    }

    [Queue("notifications")]
    [AutomaticRetry(Attempts = 3)]
    public async Task DispatchExternalNotificationsAsync(int userId, string title, string message, UserNotificationSetting settings, NotificationChannels? channels)
    {
        // 2. WhatsApp
        if (channels?.WhatsApp ?? settings.WhatsAppEnabled)
        {
            await SendWhatsAppAsync(userId, title, message);
        }
        
        // 3. SMS
        if (channels?.SMS ?? settings.SmsEnabled)
        {
            await SendSmsAsync(userId, title, message);
        }
        
        // 4. Email
        if (channels?.Email ?? settings.EmailEnabled)
        {
            await SendEmailAsync(userId, title, message);
        }
    }

    [Queue("notifications")]
    public async Task DispatchExternalNotificationsForMemberAsync(int memberId, string title, string message, NotificationChannels? channels)
    {
        if (channels?.WhatsApp == true) await SendWhatsAppAsync(0, title, message);
        if (channels?.SMS == true) await SendSmsAsync(0, title, message);
        if (channels?.Email == true) await SendEmailAsync(0, title, message);
    }

    public async Task SendPaymentReminderAsync(int userId, decimal amount, DateTime dueDate)
    {
        var title = "Payment Reminder";
        var message = $"Dear Member, your payment of ₹{amount:N2} is due on {dueDate:dd MMM yyyy}. Please clear it to avoid penalties.";
        await SendNotificationAsync(userId, title, message, NotificationType.Warning, "/portal/my-chits");
    }

    public async Task SendAuctionReminderAsync(int userId, string groupName, DateTime auctionDate)
    {
        var title = "Upcoming Auction";
        var message = $"Reminder: Auction for {groupName} is scheduled on {auctionDate:dd MMM yyyy at HH:mm}. Don't forget to join!";
        await SendNotificationAsync(userId, title, message, NotificationType.Info, "/auctions");
    }

    public async Task<UserNotificationSetting> GetUserSettingsAsync(int userId)
    {
        var settings = await _context.UserNotificationSettings.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == userId);
        if (settings == null)
        {
            settings = new UserNotificationSetting { UserId = userId };
            // Note: We don't save here to avoid side-effects in background read, 
            // the main task will handle settings creation if needed.
        }
        return settings;
    }

    public async Task UpdateUserSettingsAsync(UserNotificationSetting settings)
    {
        _context.UserNotificationSettings.Update(settings);
        await _context.SaveChangesAsync();
    }

    public async Task SendTemplatedNotificationAsync(int memberId, string templateName, Dictionary<string, string> placeholders)
    {
        // Background the entire templating and sending process
        _backgroundJobClient.Enqueue(() => ProcessAndSendTemplatedNotificationAsync(memberId, templateName, placeholders));
    }

    public async Task SendUserTemplatedNotificationAsync(int userId, string templateName, Dictionary<string, string> placeholders)
    {
        _backgroundJobClient.Enqueue(() => ProcessAndSendUserTemplatedNotificationAsync(userId, templateName, placeholders));
    }

    [Queue("notifications")]
    [AutomaticRetry(Attempts = 2)]
    public async Task ProcessAndSendTemplatedNotificationAsync(int memberId, string templateName, Dictionary<string, string> placeholders)
    {
        var result = await ProcessTemplateAsync(templateName, placeholders);
        if (result != null)
        {
            await SendMemberNotificationAsync(memberId, result.Value.Title, result.Value.Message, NotificationType.Info);
        }
    }

    [Queue("notifications")]
    [AutomaticRetry(Attempts = 2)]
    public async Task ProcessAndSendUserTemplatedNotificationAsync(int userId, string templateName, Dictionary<string, string> placeholders)
    {
        var result = await ProcessTemplateAsync(templateName, placeholders);
        if (result != null)
        {
            await SendNotificationAsync(userId, result.Value.Title, result.Value.Message, NotificationType.Info);
        }
    }

    private async Task<(string Title, string Message)?> ProcessTemplateAsync(string templateName, Dictionary<string, string> placeholders)
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

        var title = template.TitleTemplate;
        var message = template.MessageTemplate;

        foreach (var placeholder in placeholders)
        {
            title = title.Replace($"{{{placeholder.Key}}}", placeholder.Value);
            message = message.Replace($"{{{placeholder.Key}}}", placeholder.Value);
        }

        return (title, message);
    }

    private async Task SendWhatsAppAsync(int userId, string title, string message)
    {
        _logger.LogInformation("Background Sending WhatsApp to User {UserId}: {Message}", userId, message);
        await Task.CompletedTask;
    }

    private async Task SendSmsAsync(int userId, string title, string message)
    {
        _logger.LogInformation("Background Sending SMS to User {UserId}: {Message}", userId, message);
        await Task.CompletedTask;
    }

    private async Task SendEmailAsync(int userId, string title, string message)
    {
        _logger.LogInformation("Background Sending Email to User {UserId}: {Message}", userId, message);
        await Task.CompletedTask;
    }
}
