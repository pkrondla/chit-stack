using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Catalog.Commands.DeleteComponent;

public class DeleteCatalogComponentCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}

public class DeleteCatalogComponentHandler
    : IRequestHandler<DeleteCatalogComponentCommand, Result<bool>>
{
    private readonly IGlobalDbContext _context;

    public DeleteCatalogComponentHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(
        DeleteCatalogComponentCommand request,
        CancellationToken cancellationToken)
    {
        var component = await _context.SoftwareComponents
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (component is null)
            return Result<bool>.Failure("Component not found.");

        component.IsActive = false;
        component.LastModifiedAt = DateTime.UtcNow; // from BaseEntity

        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
