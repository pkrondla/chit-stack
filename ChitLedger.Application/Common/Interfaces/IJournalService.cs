using ChitLedger.Domain.Common;

namespace ChitLedger.Application.Common.Interfaces;

public interface IJournalService
{
    Task<Result<int>> CreateEntryAsync(string entryType, DateTime date, string description, 
        int? relatedEntityId, string relatedEntityType,
        int? branchId,
        List<(string AccountCode, decimal Debit, decimal Credit)> lines, 
        CancellationToken cancellationToken);
}
