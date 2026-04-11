using Microsoft.AspNetCore.SignalR;

namespace ChitStack.API.Hubs;

public class AuctionHub : Hub
{
    public async Task JoinAuction(string auctionId, int ticketId, string memberName, string source)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, auctionId);
        await Clients.Group(auctionId).SendAsync("UserJoined", ticketId, memberName, source);
    }

    public async Task LeaveAuction(string auctionId, int ticketId, string memberName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, auctionId);
        await Clients.Group(auctionId).SendAsync("UserLeft", ticketId, memberName);
    }
}
