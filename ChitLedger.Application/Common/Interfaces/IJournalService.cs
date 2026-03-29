using ChitLedger.Domain.Common;

namespace ChitLedger.Application.Common.Interfaces;

public class JournalLinePostingDto
{
    public string AccountCode { get; set; } = string.Empty;
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public string? Description { get; set; }
    
    // Sub-ledger Tags
    public int? MemberId { get; set; }
    public int? ChitGroupId { get; set; }
    public int? TicketId { get; set; }
    public int? AuctionId { get; set; }
}

public interface IJournalService
{
    Task<Result<int>> CreateEntryAsync(string entryType, DateTime date, string description, 
        int? relatedEntityId, string relatedEntityType,
        int? branchId,
        List<JournalLinePostingDto> lines, 
        CancellationToken cancellationToken);
}
