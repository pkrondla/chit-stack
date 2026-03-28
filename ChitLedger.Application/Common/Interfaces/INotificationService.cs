using ChitLedger.Domain.Entities;

namespace ChitLedger.Application.Common.Interfaces;

public interface INotificationService
{
    Task SendNotificationAsync(int userId, string title, string message, NotificationType type = NotificationType.Info, string? actionUrl = null, NotificationChannels? channels = null);
    
    Task SendMemberNotificationAsync(int memberId, string title, string message, NotificationType type = NotificationType.Info, NotificationChannels? channels = null);

    Task SendTemplatedNotificationAsync(int memberId, string templateName, Dictionary<string, string> placeholders);
    Task SendUserTemplatedNotificationAsync(int userId, string templateName, Dictionary<string, string> placeholders);

    // Automated triggers
    Task SendPaymentReminderAsync(int userId, decimal amount, DateTime dueDate);
    Task SendAuctionReminderAsync(int userId, string groupName, DateTime auctionDate);
    
    // Settings management
    Task<UserNotificationSetting> GetUserSettingsAsync(int userId);
    Task UpdateUserSettingsAsync(UserNotificationSetting settings);
}

public class NotificationChannels
{
    public bool InPortal { get; set; } = true;
    public bool WhatsApp { get; set; } = false;
    public bool SMS { get; set; } = false;
    public bool Email { get; set; } = false;
}
