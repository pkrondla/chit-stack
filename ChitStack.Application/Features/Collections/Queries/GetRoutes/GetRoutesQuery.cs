using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Collections.Queries.GetRoutes;

public class RouteDto
{
    public int Id { get; set; }
    public string RouteName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int MemberCount { get; set; }
    public int? BranchId { get; set; }
}

public class GetRoutesQuery : IRequest<Result<List<RouteDto>>>
{
}

public class GetRoutesHandler : IRequestHandler<GetRoutesQuery, Result<List<RouteDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetRoutesHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<RouteDto>>> Handle(GetRoutesQuery request, CancellationToken cancellationToken)
    {
        var routes = await _context.CollectionRoutes
            .Include(r => r.Members)
            .OrderBy(r => r.RouteName)
            .Select(r => new RouteDto
            {
                Id = r.Id,
                RouteName = r.RouteName,
                Description = r.Description,
                BranchId = r.BranchId,
                MemberCount = r.Members.Count
            })
            .ToListAsync(cancellationToken);

        return Result<List<RouteDto>>.Success(routes);
    }
}
