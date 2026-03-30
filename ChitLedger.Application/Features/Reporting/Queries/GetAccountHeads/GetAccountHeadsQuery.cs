using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Reporting.Queries.GetAccountHeads;

public class AccountHeadDto
{
    public int Id { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string AccountCode { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsGroup { get; set; }
    public int? ParentId { get; set; }
    public bool IsSystem { get; set; }
    public string? SystemRole { get; set; }
    public string? BankDetails { get; set; }
    public int? BranchId { get; set; }
    public decimal OpeningBalance { get; set; }
}

public class GetAccountHeadsQuery : IRequest<Result<List<AccountHeadDto>>>
{
}

public class GetAccountHeadsHandler : IRequestHandler<GetAccountHeadsQuery, Result<List<AccountHeadDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IBranchService _branchService;

    public GetAccountHeadsHandler(IApplicationDbContext context, IBranchService branchService)
    {
        _context = context;
        _branchService = branchService;
    }

    public async Task<Result<List<AccountHeadDto>>> Handle(GetAccountHeadsQuery request, CancellationToken cancellationToken)
    {
        var branchId = _branchService.BranchId;
        
        var accounts = await _context.AccountHeads
            .Where(a => a.BranchId == null || a.BranchId == branchId)
            .OrderBy(a => a.AccountName)
            .Select(a => new AccountHeadDto
            {
                Id = a.Id,
                AccountName = a.AccountName,
                AccountCode = a.AccountCode,
                Type = a.Type.ToString(),
                IsGroup = a.IsGroup,
                ParentId = a.ParentId,
                IsSystem = a.IsSystem,
                SystemRole = a.SystemRole,
                BankDetails = a.BankDetails,
                BranchId = a.BranchId,
                OpeningBalance = a.OpeningBalance
            })
            .ToListAsync(cancellationToken);

        return Result<List<AccountHeadDto>>.Success(accounts);
    }
}
