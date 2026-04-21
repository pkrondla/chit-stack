using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Entities;
using ChitStack.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ChitStack.API.Services;

public class TenantNotificationService : ITenantNotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public TenantNotificationService(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task PushNotificationAsync(int userId, Notification notification)
    {
        await _hubContext.Clients.Group($"User_{userId}").SendAsync("ReceiveNotification", notification);
    }
}
