using AutoMapper;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Reporting.Queries.GetLedger;

public class LedgerEntryDto
{
    public int Id { get; set; }
    public DateTime TransactionDate { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public string Narration { get; set; } = string.Empty;
    public decimal DebitAmount { get; set; }
    public decimal CreditAmount { get; set; }
    public decimal RunningBalance { get; set; }
    public bool IsReconciled { get; set; }
    public DateTime? ReconciliationDate { get; set; }
}

public class GetLedgerQuery : IRequest<Result<List<LedgerEntryDto>>>
{
    public int AccountHeadId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool UnreconciledOnly { get; set; }
    public bool ReconciledOnly { get; set; }
}

public class GetLedgerHandler : IRequestHandler<GetLedgerQuery, Result<List<LedgerEntryDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetLedgerHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<LedgerEntryDto>>> Handle(GetLedgerQuery request, CancellationToken cancellationToken)
    {
        var account = await _context.AccountHeads.FindAsync(new object[] { request.AccountHeadId }, cancellationToken);
        if (account == null) return Result<List<LedgerEntryDto>>.Failure("Account Head not found.");

        var query = _context.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => l.AccountHeadId == request.AccountHeadId);

        if (request.StartDate.HasValue)
        {
            var start = request.StartDate.Value.Date;
            query = query.Where(l => l.JournalEntry.EntryDate >= start);
        }

        if (request.EndDate.HasValue)
        {
            var end = request.EndDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(l => l.JournalEntry.EntryDate <= end);
        }

        if (request.UnreconciledOnly)
        {
            query = query.Where(l => !l.IsReconciled);
        }
        else if (request.ReconciledOnly)
        {
            query = query.Where(l => l.IsReconciled);
        }

        var orderedQuery = request.ReconciledOnly 
            ? query.OrderBy(l => l.ReconciliationDate).ThenBy(l => l.JournalEntry.EntryDate)
            : query.OrderBy(l => l.JournalEntry.EntryDate);

        var lines = await orderedQuery
            .Select(l => new LedgerEntryDto
            {
                Id = l.Id,
                TransactionDate = l.JournalEntry.EntryDate,
                TransactionType = l.JournalEntry.EntryType,
                Narration = string.IsNullOrEmpty(l.Description) ? l.JournalEntry.Description : l.Description,
                DebitAmount = l.DebitAmount,
                CreditAmount = l.CreditAmount,
                IsReconciled = l.IsReconciled,
                ReconciliationDate = l.ReconciliationDate
            })
            .ToListAsync(cancellationToken);

        // Calculate simple running balance (starting from 0 for now)
        decimal balance = 0;
        foreach (var line in lines)
        {
            balance += (line.DebitAmount - line.CreditAmount);
            line.RunningBalance = balance;
        }

        return Result<List<LedgerEntryDto>>.Success(lines);
    }
}
