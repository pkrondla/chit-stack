using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class Auction : TenantEntity
{
    public int ChitGroupId { get; set; }
    public ChitGroup ChitGroup { get; set; } = null!;
    
    public int InstallmentNumber { get; set; }
    public DateTime AuctionDate { get; set; }
    
    public int? WinnerTicketId { get; set; }
    public Ticket? WinnerTicket { get; set; }
    
    public decimal BidAmount { get; set; }
    public decimal ForemanCommission { get; set; }
    public decimal TotalDividend { get; set; }
    public decimal DividendPerMember { get; set; }
    public decimal NetPayable { get; set; } // Installment - Dividend
}
