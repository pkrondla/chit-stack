using ChitStack.Domain.Common;

namespace ChitStack.Domain.Entities;

public class Demand : BranchEntity
{
    public int TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;
    
    public int AuctionId { get; set; }
    public Auction Auction { get; set; } = null!;
    
    public int InstallmentNumber { get; set; }
    
    public decimal GrossAmount { get; set; } // Standard Installment Amount
    public decimal DividendAmount { get; set; } // Discount distributed
    public decimal NetAmount { get; set; } // Gross - Dividend (The actual payable)
    
    public decimal CollectedAmount { get; set; } // Amount paid so far
    public string Status { get; set; } = "Pending"; // Pending, Partial, Paid
    public decimal PenaltyAmount { get; set; }
    
    public DateTime DueDate { get; set; }
}
