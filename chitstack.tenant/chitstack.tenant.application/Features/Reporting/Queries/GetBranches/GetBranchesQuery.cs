using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Reporting.Queries.GetBranches;

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
    private readonly ICurrentUserService _currentUserService;

    public GetBranchesHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<BranchDto>>> Handle(GetBranchesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Branches.Where(b => b.IsActive);

        if (_currentUserService.Role != "Admin")
        {
            // Parse UserId as int. In a real world app, this might be a GUID or string, 
            // but in this domain model User.Id is an int.
            if (int.TryParse(_currentUserService.UserId, out var userId))
            {
                var userBranchIds = await _context.UserBranches
                    .Where(ub => ub.UserId == userId)
                    .Select(ub => ub.BranchId)
                    .ToListAsync(cancellationToken);

                query = query.Where(b => userBranchIds.Contains(b.Id));
            }
            else
            {
                // If no user or unable to parse, return empty list for non-admins
                return Result<List<BranchDto>>.Success(new List<BranchDto>());
            }
        }

        var branches = await query
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
