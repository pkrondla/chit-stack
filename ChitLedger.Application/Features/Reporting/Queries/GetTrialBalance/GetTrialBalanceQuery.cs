using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Reporting.Queries.GetTrialBalance;

public class TrialBalanceDto
{
    public List<TrialBalanceLine> Lines { get; set; } = new();
    public decimal TotalDebit => Lines.Sum(x => x.DebitBalance);
    public decimal TotalCredit => Lines.Sum(x => x.CreditBalance);
}

public class TrialBalanceLine
{
    public string AccountName { get; set; } = string.Empty;
    public string AccountCode { get; set; } = string.Empty;
    public decimal DebitBalance { get; set; }
    public decimal CreditBalance { get; set; }
}

public class GetTrialBalanceQuery : IRequest<Result<TrialBalanceDto>>
{
    public DateTime AsOfDate { get; set; }
    public int? BranchId { get; set; }
}

public class GetTrialBalanceHandler : IRequestHandler<GetTrialBalanceQuery, Result<TrialBalanceDto>>
{
    private readonly IApplicationDbContext _context;

    public GetTrialBalanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<TrialBalanceDto>> Handle(GetTrialBalanceQuery request, CancellationToken cancellationToken)
    {
        var lines = _context.JournalEntryLines
            .Include(l => l.AccountHead)
            .Include(l => l.JournalEntry)
            .Where(l => l.JournalEntry.EntryDate <= request.AsOfDate);

        if (request.BranchId.HasValue)
        {
            lines = lines.Where(l => l.BranchId == request.BranchId);
        }

        var aggregated = await lines
            .GroupBy(l => new { l.AccountHead.AccountName, l.AccountHead.AccountCode, l.AccountHead.Type })
            .Select(g => new
            {
                g.Key.AccountName,
                g.Key.AccountCode,
                g.Key.Type,
                NetBalance = g.Sum(x => x.DebitAmount - x.CreditAmount)
            })
            .ToListAsync(cancellationToken);

        var result = new TrialBalanceDto();
        foreach (var item in aggregated)
        {
            result.Lines.Add(new TrialBalanceLine
            {
                AccountName = item.AccountName,
                AccountCode = item.AccountCode,
                DebitBalance = item.NetBalance > 0 ? item.NetBalance : 0,
                CreditBalance = item.NetBalance < 0 ? Math.Abs(item.NetBalance) : 0
            });
        }

        return Result<TrialBalanceDto>.Success(result);
    }
}
