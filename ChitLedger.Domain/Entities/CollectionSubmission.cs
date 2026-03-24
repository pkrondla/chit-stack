using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class CollectionSubmission : BranchEntity
{
    public int AgentId { get; set; }
    public User Agent { get; set; } = null!;
    
    public DateTime SubmissionDate { get; set; } = DateTime.Now;
    public decimal TotalAmount { get; set; }
    public decimal TotalCash { get; set; }
    public decimal TotalCheque { get; set; }
    
    public string Status { get; set; } = "Pending"; // Pending, Verified, Rejected
    
    public int? VerifiedByUserId { get; set; }
    public User? VerifiedBy { get; set; }
    public DateTime? VerifiedAt { get; set; }
    
    public string? Remarks { get; set; }
    
    // Navigation
    public ICollection<Receipt> Receipts { get; set; } = new List<Receipt>();
}
