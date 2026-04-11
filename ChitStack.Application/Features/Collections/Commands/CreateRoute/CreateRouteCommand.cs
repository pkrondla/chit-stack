using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;

namespace ChitStack.Application.Features.Collections.Commands.CreateRoute;

public class CreateRouteCommand : IRequest<Result<int>>
{
    public string RouteName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? BranchId { get; set; }
}

public class CreateRouteHandler : IRequestHandler<CreateRouteCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public CreateRouteHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(CreateRouteCommand request, CancellationToken cancellationToken)
    {
        var route = new CollectionRoute
        {
            RouteName = request.RouteName,
            Description = request.Description,
            BranchId = request.BranchId
        };

        _context.CollectionRoutes.Add(route);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(route.Id);
    }
}
