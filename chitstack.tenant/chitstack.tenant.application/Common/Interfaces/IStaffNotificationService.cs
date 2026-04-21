using ChitStack.Domain.Entities;

namespace ChitStack.Application.Common.Interfaces;

/// <summary>
/// Broadcasts operational events to all non-member tenant staff users via
/// in-portal (SignalR) and/or Telegram channel, according to TenantSettings toggles.
/// All calls are fire-and-forget; the actual work runs in a Hangfire background job.
/// </summary>
public interface IStaffNotificationService
{
    void Broadcast(string title, string message, NotificationType type = NotificationType.Info);
}
