using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class AuctionBid : BranchEntity
{
    public int AuctionId { get; set; }
    public Auction Auction { get; set; } = null!;
    
    public int TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;
    
    public decimal BidAmount { get; set; }
    public DateTime BidTime { get; set; }
    public string Source { get; set; } = "Web"; // Web, Mobile, Office
}
