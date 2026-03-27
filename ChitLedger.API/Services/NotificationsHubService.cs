using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Entities;
using ChitLedger.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ChitLedger.API.Services;

public class NotificationsHubService : INotificationsHubService
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationsHubService(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task PushNotificationAsync(int userId, Notification notification)
    {
        await _hubContext.Clients.Group($"User_{userId}").SendAsync("ReceiveNotification", notification);
    }
}
