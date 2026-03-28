using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Entities;
using ChitLedger.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChitLedger.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly TenantDbContext _context;
    private readonly INotificationsHubService _hubService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        TenantDbContext context, 
        INotificationsHubService hubService,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _hubService = hubService;
        _logger = logger;
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
            // Trigger external channels if enabled by admin/force or we skip since we don't have user-level toggles
            // Here we'll just check for channel list provided by the admin.
            if (channels?.WhatsApp == true) await SendWhatsAppAsync(0, title, message); // Need separate member-based senders
            if (channels?.SMS == true) await SendSmsAsync(0, title, message);
            if (channels?.Email == true) await SendEmailAsync(0, title, message);
        }
    }

    public async Task SendNotificationAsync(int userId, string title, string message, NotificationType type = NotificationType.Info, string? actionUrl = null, NotificationChannels? channels = null)
    {
        var settings = await GetUserSettingsAsync(userId);
        
        // 1. In-Portal Notification
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
        var settings = await _context.UserNotificationSettings.FirstOrDefaultAsync(x => x.UserId == userId);
        if (settings == null)
        {
            settings = new UserNotificationSetting { UserId = userId };
            _context.UserNotificationSettings.Add(settings);
            await _context.SaveChangesAsync();
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
        var result = await ProcessTemplateAsync(templateName, placeholders);
        if (result != null)
        {
            await SendMemberNotificationAsync(memberId, result.Value.Title, result.Value.Message, NotificationType.Info);
        }
    }

    public async Task SendUserTemplatedNotificationAsync(int userId, string templateName, Dictionary<string, string> placeholders)
    {
        var result = await ProcessTemplateAsync(templateName, placeholders);
        if (result != null)
        {
            await SendNotificationAsync(userId, result.Value.Title, result.Value.Message, NotificationType.Info);
        }
    }

    private async Task<(string Title, string Message)?> ProcessTemplateAsync(string templateName, Dictionary<string, string> placeholders)
    {
        var settings = await _context.TenantSettings.FirstOrDefaultAsync();
        if (settings == null) return null;

        // Check toggle
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

        var template = await _context.NotificationTemplates.FirstOrDefaultAsync(t => t.Name == templateName);
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
        // Placeholder for real WhatsApp API integration
        _logger.LogInformation("Sending WhatsApp to User {UserId}: {Message}", userId, message);
        await Task.CompletedTask;
    }

    private async Task SendSmsAsync(int userId, string title, string message)
    {
        // Placeholder for real SMS API integration
        _logger.LogInformation("Sending SMS to User {UserId}: {Message}", userId, message);
        await Task.CompletedTask;
    }

    private async Task SendEmailAsync(int userId, string title, string message)
    {
        // Placeholder for real SMTP integration
        _logger.LogInformation("Sending Email to User {UserId}: {Message}", userId, message);
        await Task.CompletedTask;
    }
}
