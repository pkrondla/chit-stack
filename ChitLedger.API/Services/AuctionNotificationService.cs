using ChitLedger.Application.Common.Interfaces;
using ChitLedger.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ChitLedger.API.Services;

public class AuctionNotificationService : IAuctionNotificationService
{
    private readonly IHubContext<AuctionHub> _hubContext;

    public AuctionNotificationService(IHubContext<AuctionHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyBidAsync(int auctionId, string memberName, decimal amount, string? photoUrl, string source)
    {
        await _hubContext.Clients.Group(auctionId.ToString())
            .SendAsync("ReceiveBid", memberName, amount, photoUrl, source);
    }
}
