using System.Threading.Tasks;

namespace ChitLedger.Infrastructure.Services;

public interface IDailyNotificationProcessor
{
    Task ProcessAutomatedNotifications();
}
