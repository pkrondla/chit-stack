using ChitStack.Domain.Entities;

namespace ChitStack.Application.Common.Interfaces;

public interface ITenantNotificationService
{
    Task PushNotificationAsync(int userId, Notification notification);
}
