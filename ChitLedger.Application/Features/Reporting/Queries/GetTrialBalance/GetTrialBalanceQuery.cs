using ChitLedger.Application.Common.Constants;
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
    public int Id { get; set; }
    public int? ParentId { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string AccountCode { get; set; } = string.Empty;
    public decimal DebitBalance { get; set; }
    public decimal CreditBalance { get; set; }
    public bool IsGroup { get; set; }
    public List<TrialBalanceLine> Children { get; set; } = new();
    
    // Sub-ledger Info
    public int? MemberId { get; set; }
    public int? ChitGroupId { get; set; }
    public bool IsSubLedgerLine { get; set; } = false;

    internal decimal NetBalance { get; set; }
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
        var toDate = request.AsOfDate.Date.AddDays(1);
        
        // 1. Fetch Account Heads
        var allAccountHeads = await _context.AccountHeads
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // 2. Aggregate Balances for Posting Accounts
        var baseQuery = _context.JournalEntryLines
            .Where(l => l.JournalEntry.EntryDate < toDate);

        if (request.BranchId.HasValue)
        {
            baseQuery = baseQuery.Where(l => l.BranchId == request.BranchId);
        }

        // Account-level totals
        var accountBalances = await baseQuery
            .GroupBy(l => l.AccountHeadId)
            .Select(g => new { AccountHeadId = g.Key, NetBalance = g.Sum(x => x.DebitAmount - x.CreditAmount) })
            .ToListAsync(cancellationToken);

        var balanceMap = accountBalances.ToDictionary(x => x.AccountHeadId, x => x.NetBalance);

        // Sub-ledger Totals for Members
        var memberBalances = await baseQuery
            .Where(l => l.MemberId != null && 
                 (l.AccountHead.SystemRole == AccountRoles.MemberReceivable || l.AccountHead.SystemRole == AccountRoles.PrizePayable))
            .GroupBy(l => new { l.AccountHeadId, l.MemberId, Name = l.Member!.FullName })
            .Select(g => new { g.Key.AccountHeadId, g.Key.MemberId, g.Key.Name, NetBalance = g.Sum(x => x.DebitAmount - x.CreditAmount) })
            .ToListAsync(cancellationToken);

        // Sub-ledger Totals for Chit Groups (e.g. for Commission or Direct Income)
        var groupBalances = await baseQuery
            .Where(l => l.ChitGroupId != null && l.AccountHead.SystemRole == AccountRoles.CommissionIncome)
            .GroupBy(l => new { l.AccountHeadId, l.ChitGroupId, Name = l.ChitGroup!.GroupName })
            .Select(g => new { g.Key.AccountHeadId, g.Key.ChitGroupId, g.Key.Name, NetBalance = g.Sum(x => x.DebitAmount - x.CreditAmount) })
            .ToListAsync(cancellationToken);

        // 3. Construct initial DTO lines for all AccountHeads
        var allLines = allAccountHeads.Select(a => new TrialBalanceLine
        {
            Id = a.Id,
            ParentId = a.ParentId,
            AccountName = a.AccountName,
            AccountCode = a.AccountCode,
            IsGroup = a.IsGroup,
            NetBalance = balanceMap.TryGetValue(a.Id, out var bal) ? bal : 0
        }).ToList();

        // 4. Inject Sub-ledger accounts as virtual children
        var virtualCounter = -1; // Use negative IDs for virtual lines
        foreach (var mBal in memberBalances.Where(m => m.NetBalance != 0))
        {
            var parent = allLines.FirstOrDefault(x => x.Id == mBal.AccountHeadId);
            if (parent != null)
            {
                parent.Children.Add(new TrialBalanceLine
                {
                    Id = virtualCounter--,
                    ParentId = parent.Id,
                    AccountName = mBal.Name,
                    NetBalance = mBal.NetBalance,
                    IsGroup = false,
                    IsSubLedgerLine = true,
                    MemberId = mBal.MemberId
                });
            }
        }

        foreach (var gBal in groupBalances.Where(g => g.NetBalance != 0))
        {
            var parent = allLines.FirstOrDefault(x => x.Id == gBal.AccountHeadId);
            if (parent != null)
            {
                parent.Children.Add(new TrialBalanceLine
                {
                    Id = virtualCounter--,
                    ParentId = parent.Id,
                    AccountName = "Group: " + gBal.Name,
                    NetBalance = gBal.NetBalance,
                    IsGroup = false,
                    IsSubLedgerLine = true,
                    ChitGroupId = gBal.ChitGroupId
                });
            }
        }

        // 5. Recursive aggregation of group balances
        // We sort by depth (or just loops since COA is shallow) to ensure children add up to parents
        var lineMap = allLines.ToDictionary(x => x.Id);
        BuildHierarchy(allLines, lineMap);

        // Calculate recursive balances for groups
        RecalculateGroupBalances(allLines);

        // 6. Convert to TrialBalanceDto
        var result = new TrialBalanceDto();
        foreach (var line in allLines.Where(x => x.ParentId == null))
        {
            FinalizeLineBalances(line);
            if (line.DebitBalance != 0 || line.CreditBalance != 0 || line.Children.Any())
            {
                result.Lines.Add(line);
            }
        }

        return Result<TrialBalanceDto>.Success(result);
    }

    private void BuildHierarchy(List<TrialBalanceLine> allLines, Dictionary<int, TrialBalanceLine> lineMap)
    {
        foreach (var line in allLines.Where(l => l.ParentId != null))
        {
            if (lineMap.TryGetValue(line.ParentId!.Value, out var parent))
            {
                parent.Children.Add(line);
            }
        }
    }

    private decimal RecalculateGroupBalances(List<TrialBalanceLine> lines)
    {
        decimal total = 0;
        foreach (var line in lines)
        {
            if (line.IsGroup)
            {
                line.NetBalance = RecalculateLine(line);
            }
        }
        return total;
    }

    private decimal RecalculateLine(TrialBalanceLine line)
    {
        decimal sum = line.IsGroup ? 0 : line.NetBalance;
        foreach (var child in line.Children)
        {
            sum += RecalculateLine(child);
        }
        line.NetBalance = sum;
        return sum;
    }

    private void FinalizeLineBalances(TrialBalanceLine line)
    {
        line.DebitBalance = line.NetBalance > 0 ? line.NetBalance : 0;
        line.CreditBalance = line.NetBalance < 0 ? Math.Abs(line.NetBalance) : 0;
        
        foreach (var child in line.Children)
        {
            FinalizeLineBalances(child);
        }
    }
}
