using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class JournalEntry : TenantEntity
{
    public DateTime EntryDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public int? ReferenceId { get; set; } // Link to ReceiptId or AuctionId
    public string ReferenceType { get; set; } = string.Empty; // "Receipt", "Auction"
    
    public ICollection<JournalEntryLine> Lines { get; set; } = new List<JournalEntryLine>();
}

public class JournalEntryLine : TenantEntity
{
    public int JournalEntryId { get; set; }
    public JournalEntry JournalEntry { get; set; } = null!;
    
    public int AccountHeadId { get; set; }
    public AccountHead AccountHead { get; set; } = null!;
    
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
}
