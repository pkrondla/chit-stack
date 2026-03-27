using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ChitLedger.Infrastructure.Services;

public class DailyNotificationWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DailyNotificationWorker> _logger;

    public DailyNotificationWorker(IServiceProvider serviceProvider, ILogger<DailyNotificationWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // Run daily at 9:00 AM
            var now = DateTime.Now;
            var nextRun = now.Date.AddDays(1).AddHours(9);
            var delay = nextRun - now;

            _logger.LogInformation("Next notification run at: {NextRun}", nextRun);
            await Task.Delay(delay, stoppingToken);

            try
            {
                await ProcessAutomatedNotifications();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing automated notifications");
            }
        }
    }

    private async Task ProcessAutomatedNotifications()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TenantDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
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
                // Find associated User for the Member
                var user = await context.Users.FirstOrDefaultAsync(u => u.MemberId == demand.Ticket.MemberId);
                if (user != null)
                {
                    await notificationService.SendPaymentReminderAsync(user.Id, demand.NetAmount, demand.DueDate);
                }
            }
        }

        // 2. Auction Reminders
        if (settings.AutoAuctionRemindersEnabled)
        {
            var targetAuctionDate = DateTime.Today.AddDays(1); // Placeholder: tomorrow's auctions
            var upcomingAuctions = await context.Auctions
                .Include(a => a.ChitGroup)
                .Where(a => a.AuctionStatus == "Scheduled" && a.AuctionDate.Date == targetAuctionDate)
                .ToListAsync();

            foreach (var auction in upcomingAuctions)
            {
                // Notify all members of the group
                var tickets = await context.Tickets
                    .Include(t => t.Member)
                    .Where(t => t.ChitGroupId == auction.ChitGroupId)
                    .ToListAsync();

                foreach (var ticket in tickets)
                {
                    var user = await context.Users.FirstOrDefaultAsync(u => u.MemberId == ticket.MemberId);
                    if (user != null)
                    {
                        await notificationService.SendAuctionReminderAsync(user.Id, auction.ChitGroup.GroupName, auction.AuctionDate);
                    }
                }
            }
        }
    }
}
