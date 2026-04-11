using ChitStack.Application.Common.Interfaces;
using ChitStack.Application.Common.Constants;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Reporting.Queries.GetCashBook;

public class CashBookEntryDto
{
    public int Id { get; set; }
    public int VoucherNumber { get; set; }
    public DateTime TransactionDate { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string EntryType { get; set; } = string.Empty;
    public string Narration { get; set; } = string.Empty;
    public decimal DebitAmount { get; set; }  // Receipts
    public decimal CreditAmount { get; set; } // Payments
}

public class GetCashBookQuery : IRequest<Result<List<CashBookEntryDto>>>
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int? BranchId { get; set; }
}

public class GetCashBookHandler : IRequestHandler<GetCashBookQuery, Result<List<CashBookEntryDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetCashBookHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<CashBookEntryDto>>> Handle(GetCashBookQuery request, CancellationToken cancellationToken)
    {
        var start = request.FromDate.Date;
        var end = request.ToDate.Date.AddDays(1).AddTicks(-1);

        var cashBankQuery = _context.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Include(l => l.AccountHead)
            .Where(l => l.AccountHead.SystemRole == AccountRoles.Cash || l.AccountHead.SystemRole == AccountRoles.Bank)
            .Where(l => l.JournalEntry.EntryDate >= start && l.JournalEntry.EntryDate <= end)
            .AsQueryable();

        if (request.BranchId.HasValue)
            cashBankQuery = cashBankQuery.Where(l => l.BranchId == request.BranchId);

        var entries = await cashBankQuery
            .OrderBy(l => l.JournalEntry.EntryDate)
            .Select(l => new CashBookEntryDto
            {
                Id = l.Id,
                VoucherNumber = l.JournalEntryId,
                TransactionDate = l.JournalEntry.EntryDate,
                AccountName = l.AccountHead.AccountName,
                EntryType = l.JournalEntry.EntryType,
                Narration = string.IsNullOrEmpty(l.Description) ? l.JournalEntry.Description : l.Description,
                DebitAmount = l.DebitAmount,  // Debit to Cash/Bank is a Receipt
                CreditAmount = l.CreditAmount // Credit to Cash/Bank is a Payment
            })
            .ToListAsync(cancellationToken);

        return Result<List<CashBookEntryDto>>.Success(entries);
    }
}
