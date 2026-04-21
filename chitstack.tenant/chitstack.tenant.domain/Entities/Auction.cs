using ChitStack.Domain.Common;

namespace ChitStack.Domain.Entities;

public class Auction : BranchEntity
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
    public decimal TdsAmount { get; set; } // Total TDS/TCS for this auction
    public decimal NetPayableAmount { get; set; } // To the winner
    
    public bool IsPaid { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string? PaymentMode { get; set; } // Cheque/NEFT
    public string? PaymentReference { get; set; }

    // Session Timing for synchronized timer
    public DateTime? SessionStartedAt { get; set; }
    public int SessionDurationMinutes { get; set; }
}
