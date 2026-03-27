using ChitLedger.Domain.Entities;

namespace ChitLedger.Application.Common.Interfaces;

public interface INotificationService
{
    Task SendNotificationAsync(int userId, string title, string message, NotificationType type = NotificationType.Info, string? actionUrl = null);
    
    // Automated triggers
    Task SendPaymentReminderAsync(int userId, decimal amount, DateTime dueDate);
    Task SendAuctionReminderAsync(int userId, string groupName, DateTime auctionDate);
    
    // Settings management
    Task<UserNotificationSetting> GetUserSettingsAsync(int userId);
    Task UpdateUserSettingsAsync(UserNotificationSetting settings);
}
