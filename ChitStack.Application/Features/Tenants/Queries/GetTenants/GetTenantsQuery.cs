using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Tenants.Queries.GetTenants;

public class TenantDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string TenantKey { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class GetTenantsQuery : IRequest<Result<List<TenantDto>>>
{
}

public class GetTenantsHandler : IRequestHandler<GetTenantsQuery, Result<List<TenantDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetTenantsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<TenantDto>>> Handle(GetTenantsQuery request, CancellationToken cancellationToken)
    {
        var tenants = await _context.Tenants
            .Select(t => new TenantDto
            {
                Id = t.Id,
                Name = t.Name,
                TenantKey = t.TenantKey,
                Status = t.SubscriptionStatus
            })
            .ToListAsync(cancellationToken);

        return Result<List<TenantDto>>.Success(tenants);
    }
}
