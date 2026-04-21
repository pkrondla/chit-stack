using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Reporting.Queries.GetAuditorSummary;

public class AuditorSummaryDto
{
    public decimal TotalAssets { get; set; }
    public decimal TotalLiabilities { get; set; }
    public decimal NetProfit { get; set; }
    public int MemberCount { get; set; }
}

public class GetAuditorSummaryQuery : IRequest<Result<AuditorSummaryDto>>
{
}

public class GetAuditorSummaryHandler : IRequestHandler<GetAuditorSummaryQuery, Result<AuditorSummaryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAuditorSummaryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<AuditorSummaryDto>> Handle(GetAuditorSummaryQuery request, CancellationToken cancellationToken)
    {
        var balances = await _context.JournalEntryLines
            .Include(l => l.AccountHead)
            .GroupBy(l => l.AccountHead.Type)
            .Select(g => new
            {
                Type = g.Key,
                Balance = g.Sum(x => x.DebitAmount - x.CreditAmount)
            })
            .ToListAsync(cancellationToken);

        var memberCount = await _context.Members.CountAsync(cancellationToken);

        var result = new AuditorSummaryDto
        {
            MemberCount = memberCount
        };

        foreach (var b in balances)
        {
            switch (b.Type)
            {
                case AccountType.Asset:
                    result.TotalAssets = b.Balance;
                    break;
                case AccountType.Liability:
                    // Liabilities are usually credit balances (negative in our Debit-Credit sum)
                    result.TotalLiabilities = -b.Balance;
                    break;
                case AccountType.Income:
                    // Income is usually credit (negative)
                    result.NetProfit += (-b.Balance);
                    break;
                case AccountType.Expense:
                    // Expense is usually debit (positive)
                    result.NetProfit -= b.Balance;
                    break;
            }
        }

        return Result<AuditorSummaryDto>.Success(result);
    }
}
