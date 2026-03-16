using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Reporting.Queries.GetBranches;

public class BranchDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class GetBranchesQuery : IRequest<Result<List<BranchDto>>>
{
}

public class GetBranchesHandler : IRequestHandler<GetBranchesQuery, Result<List<BranchDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetBranchesHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<BranchDto>>> Handle(GetBranchesQuery request, CancellationToken cancellationToken)
    {
        var branches = await _context.Branches
            .Where(b => b.IsActive)
            .Select(b => new BranchDto
            {
                Id = b.Id,
                Name = b.Name,
                Code = b.Code
            })
            .ToListAsync(cancellationToken);

        return Result<List<BranchDto>>.Success(branches);
    }
}
