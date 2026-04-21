using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Reporting.Queries.GetProfitAndLoss;

public class ProfitAndLossDto
{
    public List<PlLineItem> Income { get; set; } = new();
    public List<PlLineItem> Expense { get; set; } = new();
    public decimal TotalIncome => Income.Sum(x => x.Amount);
    public decimal TotalExpense => Expense.Sum(x => x.Amount);
    public decimal NetProfit => TotalIncome - TotalExpense;
}

public class PlLineItem
{
    public string AccountName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class GetProfitAndLossQuery : IRequest<Result<ProfitAndLossDto>>
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? BranchId { get; set; }
}

public class GetProfitAndLossHandler : IRequestHandler<GetProfitAndLossQuery, Result<ProfitAndLossDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProfitAndLossHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ProfitAndLossDto>> Handle(GetProfitAndLossQuery request, CancellationToken cancellationToken)
    {
        var startDate = request.StartDate.Date;
        var endDate = request.EndDate.Date.AddDays(1);

        var lines = _context.JournalEntryLines
            .Include(l => l.AccountHead)
            .Include(l => l.JournalEntry)
            .Where(l => l.JournalEntry.EntryDate >= startDate && l.JournalEntry.EntryDate < endDate);

        if (request.BranchId.HasValue)
        {
            lines = lines.Where(l => l.BranchId == request.BranchId);
        }

        var aggregated = await lines
            .GroupBy(l => new { l.AccountHead.AccountName, l.AccountHead.Type })
            .Select(g => new
            {
                g.Key.AccountName,
                g.Key.Type,
                Balance = g.Key.Type == AccountType.Income ? g.Sum(x => x.CreditAmount - x.DebitAmount) : g.Sum(x => x.DebitAmount - x.CreditAmount)
            })
            .ToListAsync(cancellationToken);

        var pl = new ProfitAndLossDto();
        
        pl.Income = aggregated
            .Where(a => a.Type == AccountType.Income)
            .Select(a => new PlLineItem { AccountName = a.AccountName, Amount = a.Balance })
            .ToList();

        pl.Expense = aggregated
            .Where(a => a.Type == AccountType.Expense)
            .Select(a => new PlLineItem { AccountName = a.AccountName, Amount = a.Balance })
            .ToList();

        return Result<ProfitAndLossDto>.Success(pl);
    }
}
