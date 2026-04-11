using ChitStack.Domain.Entities;

namespace ChitStack.Application.Common.Interfaces;

public interface INotificationsHubService
{
    Task PushNotificationAsync(int userId, Notification notification);
}
