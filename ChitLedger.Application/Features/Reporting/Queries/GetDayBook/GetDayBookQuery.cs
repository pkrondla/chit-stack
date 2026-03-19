using AutoMapper;
using AutoMapper.QueryableExtensions;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Reporting.Queries.GetDayBook;

public class DayBookEntryDto
{
    public int Id { get; set; }
    public int VoucherNumber { get; set; }
    public DateTime TransactionDate { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string EntryType { get; set; } = string.Empty;
    public string Narration { get; set; } = string.Empty;
    public decimal DebitAmount { get; set; }
    public decimal CreditAmount { get; set; }
}

public class GetDayBookQuery : IRequest<Result<List<DayBookEntryDto>>>
{
    public DateTime? Date { get; set; }
    public DateTime? EndDate { get; set; }
    public int? Limit { get; set; }
    public int? BranchId { get; set; }
}

public class GetDayBookHandler : IRequestHandler<GetDayBookQuery, Result<List<DayBookEntryDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetDayBookHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<DayBookEntryDto>>> Handle(GetDayBookQuery request, CancellationToken cancellationToken)
    {
        var query = _context.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Include(l => l.AccountHead)
            .AsQueryable();

        if (request.BranchId.HasValue)
        {
            query = query.Where(l => l.BranchId == request.BranchId);
        }

        if (request.Date.HasValue)
        {
            var start = request.Date.Value.Date;
            var end = request.EndDate?.Date.AddDays(1).AddTicks(-1) ?? start.AddDays(1).AddTicks(-1);
            query = query.Where(l => l.JournalEntry.EntryDate >= start && l.JournalEntry.EntryDate <= end);
            query = query.OrderBy(l => l.JournalEntry.EntryDate);
        }
        else
        {
            query = query.OrderByDescending(l => l.JournalEntry.EntryDate);
        }

        if (request.Limit.HasValue)
        {
            query = query.Take(request.Limit.Value);
        }

        var lines = await query
            .Select(l => new DayBookEntryDto
            {
                Id = l.Id,
                VoucherNumber = l.JournalEntryId,
                TransactionDate = l.JournalEntry.EntryDate,
                AccountName = l.AccountHead.AccountName,
                EntryType = l.JournalEntry.EntryType,
                Narration = string.IsNullOrEmpty(l.Description) ? l.JournalEntry.Description : l.Description,
                DebitAmount = l.DebitAmount,
                CreditAmount = l.CreditAmount
            })
            .ToListAsync(cancellationToken);

        return Result<List<DayBookEntryDto>>.Success(lines);
    }
}
