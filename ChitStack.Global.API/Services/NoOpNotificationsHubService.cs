using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Entities;

namespace ChitStack.Global.API.Services;

public sealed class NoOpNotificationsHubService : INotificationsHubService
{
    public Task PushNotificationAsync(int userId, Notification notification) => Task.CompletedTask;
}
