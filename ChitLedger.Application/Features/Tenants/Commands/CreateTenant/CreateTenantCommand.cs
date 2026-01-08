using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Tenants.Commands.CreateTenant;

public class CreateTenantCommand : IRequest<Result<int>>
{
    public string Name { get; set; } = string.Empty;
    public string TenantKey { get; set; } = string.Empty;
}

public class CreateTenantHandler : IRequestHandler<CreateTenantCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public CreateTenantHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(CreateTenantCommand request, CancellationToken cancellationToken)
    {
        if (await _context.Tenants.AnyAsync(t => t.TenantKey == request.TenantKey, cancellationToken))
            return Result<int>.Failure("Tenant Key already exists.");

        var tenant = new Tenant
        {
            Name = request.Name,
            TenantKey = request.TenantKey,
            SubscriptionStatus = "Active",
            // CreatedAt handled by BaseEntity
        };

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(tenant.Id);
    }
}
