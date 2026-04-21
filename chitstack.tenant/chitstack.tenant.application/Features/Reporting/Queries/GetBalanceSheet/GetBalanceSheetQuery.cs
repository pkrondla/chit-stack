using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Reporting.Queries.GetBalanceSheet;

public class BalanceSheetDto
{
    public List<BsLineItem> Assets { get; set; } = new();
    public List<BsLineItem> Liabilities { get; set; } = new();
    public decimal TotalAssets => Assets.Sum(x => x.Amount);
    public decimal TotalLiabilities => Liabilities.Sum(x => x.Amount);
    public decimal Equity => TotalAssets - TotalLiabilities;
}

public class BsLineItem
{
    public string AccountName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class GetBalanceSheetQuery : IRequest<Result<BalanceSheetDto>>
{
    public DateTime AsOfDate { get; set; }
    public int? BranchId { get; set; }
}

public class GetBalanceSheetHandler : IRequestHandler<GetBalanceSheetQuery, Result<BalanceSheetDto>>
{
    private readonly IApplicationDbContext _context;

    public GetBalanceSheetHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<BalanceSheetDto>> Handle(GetBalanceSheetQuery request, CancellationToken cancellationToken)
    {
        var toDate = request.AsOfDate.Date.AddDays(1);
        var lines = _context.JournalEntryLines
            .Include(l => l.AccountHead)
            .Include(l => l.JournalEntry)
            .Where(l => l.JournalEntry.EntryDate < toDate);

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
                Balance = g.Key.Type == AccountType.Asset ? g.Sum(x => x.DebitAmount - x.CreditAmount) : g.Sum(x => x.CreditAmount - x.DebitAmount)
            })
            .ToListAsync(cancellationToken);

        var result = new BalanceSheetDto();
        
        result.Assets = aggregated
            .Where(a => a.Type == AccountType.Asset)
            .Select(a => new BsLineItem { AccountName = a.AccountName, Amount = a.Balance })
            .ToList();

        result.Liabilities = aggregated
            .Where(a => a.Type == AccountType.Liability)
            .Select(a => new BsLineItem { AccountName = a.AccountName, Amount = a.Balance })
            .ToList();

        return Result<BalanceSheetDto>.Success(result);
    }
}
