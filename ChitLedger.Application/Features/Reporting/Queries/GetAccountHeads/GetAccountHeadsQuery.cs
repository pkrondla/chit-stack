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
}

public class GetAccountHeadsQuery : IRequest<Result<List<AccountHeadDto>>>
{
}

public class GetAccountHeadsHandler : IRequestHandler<GetAccountHeadsQuery, Result<List<AccountHeadDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAccountHeadsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AccountHeadDto>>> Handle(GetAccountHeadsQuery request, CancellationToken cancellationToken)
    {
        var accounts = await _context.AccountHeads
            .OrderBy(a => a.AccountName)
            .Select(a => new AccountHeadDto
            {
                Id = a.Id,
                AccountName = a.AccountName,
                AccountCode = a.AccountCode,
                Type = a.Type.ToString()
            })
            .ToListAsync(cancellationToken);

        return Result<List<AccountHeadDto>>.Success(accounts);
    }
}
