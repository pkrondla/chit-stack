using ChitStack.Application.Common.Interfaces;
using ChitStack.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ChitStack.API.Services;

public class AuctionNotificationService : IAuctionNotificationService
{
    private readonly IHubContext<AuctionHub> _hubContext;

    public AuctionNotificationService(IHubContext<AuctionHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyBidAsync(int auctionId, int ticketId, string memberName, decimal amount, string? photoUrl, string source)
    {
        await _hubContext.Clients.Group(auctionId.ToString())
            .SendAsync("ReceiveBid", memberName, amount, photoUrl, source, ticketId);
    }

    public async Task NotifyAttendanceAsync(int auctionId, int ticketId, string memberName, bool isPresent)
    {
        await _hubContext.Clients.Group(auctionId.ToString())
            .SendAsync("ReceiveAttendance", ticketId, memberName, isPresent);
    }

    public async Task NotifyAuctionStartedAsync(int auctionId, int durationMinutes)
    {
        await _hubContext.Clients.Group(auctionId.ToString())
            .SendAsync("AuctionStarted", durationMinutes, DateTime.UtcNow.AddMinutes(durationMinutes));
    }

    public async Task NotifyAuctionClosedAsync(int auctionId, int winningTicketId, string winnerName, decimal winningBid)
    {
        await _hubContext.Clients.Group(auctionId.ToString())
            .SendAsync("AuctionClosed", winningTicketId, winnerName, winningBid);
    }

    public async Task NotifyLotteryStartedAsync(int auctionId, IEnumerable<object> participants, int winnerTicketId)
    {
        await _hubContext.Clients.Group(auctionId.ToString())
            .SendAsync("LotteryStarted", participants, winnerTicketId);
    }

    public async Task NotifyTieBreakerDetectedAsync(int auctionId, int secondsRemaining)
    {
        await _hubContext.Clients.Group(auctionId.ToString())
            .SendAsync("TieBreakerDetected", secondsRemaining);
    }
}
