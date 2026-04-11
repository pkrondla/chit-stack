using System.Threading.Tasks;

namespace ChitStack.Infrastructure.Services;

public interface IDailyNotificationProcessor
{
    Task ProcessAutomatedNotifications();
}
