using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class Receipt : BranchEntity
{
    public int TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;
    
    public int AuctionId { get; set; }
    public Auction Auction { get; set; } = null!;
    
    public decimal AmountReceived { get; set; }
    public DateTime ReceiptDate { get; set; }
    public string PaymentMode { get; set; } = "Cash"; // Cash, Bank, UPI
    public string? ReferenceNumber { get; set; }
}
