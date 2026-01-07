using AutoMapper;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Reporting.Queries.GetLedger;

public class LedgerEntryDto
{
    public DateTime Date { get; set; }
    public string TransactionType { get; set; } = string.Empty; // Journal Type
    public string Description { get; set; } = string.Empty;
    public decimal DebitAmount { get; set; }
    public decimal CreditAmount { get; set; }
    // Running Balance to be calculated client side or projected
}

public class GetLedgerQuery : IRequest<Result<List<LedgerEntryDto>>>
{
    public int AccountHeadId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class GetLedgerHandler : IRequestHandler<GetLedgerQuery, Result<List<LedgerEntryDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetLedgerHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<LedgerEntryDto>>> Handle(GetLedgerQuery request, CancellationToken cancellationToken)
    {
        var account = await _context.AccountHeads.FindAsync(new object[] { request.AccountHeadId }, cancellationToken);
        if (account == null) return Result<List<LedgerEntryDto>>.Failure("Account Head not found.");

        var lines = await _context.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => l.AccountHeadId == request.AccountHeadId 
                        && l.JournalEntry.EntryDate >= request.StartDate 
                        && l.JournalEntry.EntryDate <= request.EndDate)
            .OrderBy(l => l.JournalEntry.EntryDate)
            .Select(l => new LedgerEntryDto
            {
                Date = l.JournalEntry.EntryDate,
                TransactionType = l.JournalEntry.EntryType,
                Description = l.JournalEntry.Description, // Or line desc?
                DebitAmount = l.DebitAmount,
                CreditAmount = l.CreditAmount
            })
            .ToListAsync(cancellationToken);

        return Result<List<LedgerEntryDto>>.Success(lines);
    }
}
