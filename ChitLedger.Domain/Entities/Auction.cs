using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class Auction : TenantEntity
{
    public int ChitGroupId { get; set; }
    public ChitGroup ChitGroup { get; set; } = null!;
    
    public int InstallmentNumber { get; set; }
    public DateTime AuctionDate { get; set; }
    public string AuctionStatus { get; set; } = "Scheduled"; // Scheduled, Open, Closed

    public int? WinningTicketId { get; set; }
    public Ticket? WinningTicket { get; set; }
    
    public decimal WinningBidAmount { get; set; } // The Discount
    public decimal ForemanCommissionAmount { get; set; }
    public decimal DividendAmount { get; set; } // Per ticket
    public decimal NetPayableAmount { get; set; } // To the winner
}
