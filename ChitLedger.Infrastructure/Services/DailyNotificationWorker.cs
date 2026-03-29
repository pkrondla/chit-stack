using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Hangfire;

namespace ChitLedger.Infrastructure.Services;

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

    public async Task ProcessAutomatedNotifications()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TenantDbContext>();
        var settings = await context.TenantSettings.FirstOrDefaultAsync();

        if (settings == null) return;

        // 1. Payment Reminders
        if (settings.AutoPaymentRemindersEnabled)
        {
            var reminderDate = DateTime.Today.AddDays(settings.PaymentReminderDaysBefore);
            var pendingDemands = await context.Demands
                .Include(d => d.Ticket)
                .ThenInclude(t => t.Member)
                .Where(d => d.Status != "Paid" && d.DueDate.Date == reminderDate)
                .ToListAsync();

            foreach (var demand in pendingDemands)
            {
                var user = await context.Users.FirstOrDefaultAsync(u => u.MemberId == demand.Ticket.MemberId);
                if (user != null)
                {
                    // Enqueue each reminder as an individual background job
                    _backgroundJobClient.Enqueue<INotificationService>(s => s.SendPaymentReminderAsync(user.Id, demand.NetAmount, demand.DueDate));
                }
            }
        }

        // 2. Auction Reminders
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
                    if (user != null)
                    {
                        // Enqueue each reminder as an individual background job
                        _backgroundJobClient.Enqueue<INotificationService>(s => s.SendAuctionReminderAsync(user.Id, auction.ChitGroup.GroupName, auction.AuctionDate));
                    }
                }
            }
        }
    }
}
