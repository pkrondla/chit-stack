using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using ChitLedger.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Infrastructure.Services;

public class JournalService : IJournalService
{
    private readonly TenantDbContext _context; // Use concrete TenantDbContext to access everything

    public JournalService(TenantDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> CreateEntryAsync(string entryType, DateTime date, string description, 
        int? relatedEntityId, string relatedEntityType,
        int? branchId,
        List<JournalLinePostingDto> lines, 
        CancellationToken cancellationToken)
    {
        // Validation: Debits must equal Credits
        var totalDebit = lines.Sum(l => l.Debit);
        var totalCredit = lines.Sum(l => l.Credit);

        if (totalDebit != totalCredit)
        {
            return Result<int>.Failure($"Journal Entry Unbalanced: Debit {totalDebit} vs Credit {totalCredit}");
        }

        // Create Header
        var entry = new JournalEntry
        {
             EntryDate = date,
             Description = description,
             EntryType = entryType,
             ReferenceId = relatedEntityId,
             ReferenceType = relatedEntityType,
             BranchId = branchId
        };
        
        _context.JournalEntries.Add(entry);
        
        // Add Lines
        foreach (var line in lines)
        {
            var account = await _context.AccountHeads.FirstOrDefaultAsync(a => a.AccountCode == line.AccountCode, cancellationToken);
            if (account == null)
            {
                return Result<int>.Failure($"Account Code {line.AccountCode} not found.");
            }

            var entryLine = new JournalEntryLine
            {
                JournalEntry = entry,
                AccountHeadId = account.Id,
                DebitAmount = line.Debit,
                CreditAmount = line.Credit,
                Description = line.Description ?? description,
                BranchId = branchId,
                
                // Industrial Tagging
                MemberId = line.MemberId,
                ChitGroupId = line.ChitGroupId,
                TicketId = line.TicketId,
                AuctionId = line.AuctionId
            };
            _context.JournalEntryLines.Add(entryLine);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(entry.Id);
    }
}
