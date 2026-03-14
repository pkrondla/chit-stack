using Microsoft.AspNetCore.SignalR;

namespace ChitLedger.API.Hubs;

public class AuctionHub : Hub
{
    public async Task JoinAuction(string auctionId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, auctionId);
        await Clients.Group(auctionId).SendAsync("UserJoined", Context.ConnectionId);
    }

    public async Task LeaveAuction(string auctionId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, auctionId);
        await Clients.Group(auctionId).SendAsync("UserLeft", Context.ConnectionId);
    }
}
