using ChitLedger.Domain.Entities;

namespace ChitLedger.Application.Common.Interfaces;

public interface INotificationsHubService
{
    Task PushNotificationAsync(int userId, Notification notification);
}
