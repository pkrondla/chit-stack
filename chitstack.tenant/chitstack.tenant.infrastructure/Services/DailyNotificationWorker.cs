using ChitStack.Application.Common.Interfaces;
using ChitStack.Infrastructure.Data;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ChitStack.Infrastructure.Tenant.Services;

public class DailyNotificationWorker : IDailyNotificationProcessor
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DailyNotificationWorker> _logger;
    private readonly IBackgroundJobClient _backgroundJobClient;

    public DailyNotificationWorker(IServiceProvider serviceProvider, ILogger<DailyNotificationWorker> logger, IBackgroundJobClient backgroundJobClient)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _backgroundJobClient = backgroundJobClient;
    }

    [Queue("tenant-maintenance")]
    public async Task ProcessAutomatedNotifications()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TenantDbContext>();
        var settings = await context.TenantSettings.FirstOrDefaultAsync();

        if (settings == null) return;

        if (settings.AutoPaymentRemindersEnabled)
        {
            var reminderDate = DateTime.Today.AddDays(settings.PaymentReminderDaysBefore);
            var pendingDemands = await context.Demands
                .Include(d => d.Ticket)
                .ThenInclude(t => t.Member)
                .Include(d => d.Ticket)
                .ThenInclude(t => t.ChitGroup)
                .Where(d => d.Status != "Paid" && d.DueDate.Date == reminderDate)
                .ToListAsync();

            foreach (var demand in pendingDemands)
            {
                var user = await context.Users.FirstOrDefaultAsync(u => u.MemberId == demand.Ticket.MemberId);
                if (user == null) continue;

                var userSettings = await context.UserNotificationSettings.FirstOrDefaultAsync(s => s.UserId == user.Id);
                if (userSettings != null && !userSettings.PaymentRemindersEnabled) continue;

                var placeholders = new Dictionary<string, string>
                {
                    { "ChitGroup", demand.Ticket.ChitGroup?.GroupName ?? "your chit group" },
                    { "Amount", demand.NetAmount.ToString("N2") },
                    { "DueDate", demand.DueDate.ToString("dd MMM yyyy") }
                };
                _backgroundJobClient.Enqueue<INotificationService>(s => s.SendUserTemplatedNotificationAsync(user.Id, "Payment Reminders", placeholders));
            }
        }

        if (settings.AutoAuctionRemindersEnabled)
        {
            var targetAuctionDate = DateTime.Today.AddDays(1);
            var upcomingAuctions = await context.Auctions
                .Include(a => a.ChitGroup)
                .Where(a => a.AuctionStatus == "Scheduled" && a.AuctionDate.Date == targetAuctionDate)
                .ToListAsync();

            foreach (var auction in upcomingAuctions)
            {
                var tickets = await context.Tickets
                    .Include(t => t.Member)
                    .Where(t => t.ChitGroupId == auction.ChitGroupId)
                    .ToListAsync();

                foreach (var ticket in tickets)
                {
                    var user = await context.Users.FirstOrDefaultAsync(u => u.MemberId == ticket.MemberId);
                    if (user == null) continue;

                    var userSettings = await context.UserNotificationSettings.FirstOrDefaultAsync(s => s.UserId == user.Id);
                    if (userSettings != null && !userSettings.AuctionRemindersEnabled) continue;

                    var hoursUntil = Math.Round((auction.AuctionDate - DateTime.Now).TotalHours, 0).ToString("0");
                    var placeholders = new Dictionary<string, string>
                    {
                        { "ChitGroup", auction.ChitGroup.GroupName },
                        { "Hours", hoursUntil }
                    };
                    _backgroundJobClient.Enqueue<INotificationService>(s => s.SendUserTemplatedNotificationAsync(user.Id, "Auction Alerts", placeholders));
                }
            }
        }
    }
}
