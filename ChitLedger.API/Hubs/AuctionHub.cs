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

    public async Task PlaceBid(string auctionId, decimal amount, string memberName)
    {
        // In a real app, validation happens here (Check constraints, database update)
        // For V1, we broadcast the bid and assume Controller handles persistence via API call if needed, 
        // OR we can inject Mediator here. 
        // Let's keep it simple: Broadcast first, UI calls API to persist, then API uses IHubContext to notify?
        // Better approach for Real-time: Hub handles the "Event", persists, then notifies.
        
        // For now, we will just echo the bid to everyone. The persistence should ideally happen via an API 
        // that validates the bid, saves it, and THEN broadcasts the new "Current High Bid".
        // Use the API -> HubContext approach for state changes.
        
        // But for pure "Room" chatter:
        await Clients.Group(auctionId).SendAsync("ReceiveBid", memberName, amount);
    }
}
