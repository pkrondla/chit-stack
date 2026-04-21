namespace ChitStack.Infrastructure.Tenant.Services;

public interface IDailyNotificationProcessor
{
    Task ProcessAutomatedNotifications();
}
