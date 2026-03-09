using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class JournalEntry : BranchEntity
{
    public DateTime EntryDate { get; set; }
    public string EntryType { get; set; } = string.Empty; // Receipt, Auction, General
    public string Description { get; set; } = string.Empty;
    public int? ReferenceId { get; set; } // Link to ReceiptId or AuctionId
    public string ReferenceType { get; set; } = string.Empty; // "Receipt", "Auction"
    
    public ICollection<JournalEntryLine> Lines { get; set; } = new List<JournalEntryLine>();
}

public class JournalEntryLine : BranchEntity
{
    public int JournalEntryId { get; set; }
    public JournalEntry JournalEntry { get; set; } = null!;
    
    public int AccountHeadId { get; set; }
    public AccountHead AccountHead { get; set; } = null!;
    
    public decimal DebitAmount { get; set; }
    public decimal CreditAmount { get; set; }
    public string Description { get; set; } = string.Empty;
}
