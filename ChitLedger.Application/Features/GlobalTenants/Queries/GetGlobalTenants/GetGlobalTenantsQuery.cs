using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.GlobalTenants.Queries.GetGlobalTenants;

public class GlobalTenantDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
}

public class GetGlobalTenantsQuery : IRequest<Result<List<GlobalTenantDto>>>
{
}

public class GetGlobalTenantsHandler : IRequestHandler<GetGlobalTenantsQuery, Result<List<GlobalTenantDto>>>
{
    private readonly IGlobalDbContext _context;

    public GetGlobalTenantsHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<GlobalTenantDto>>> Handle(GetGlobalTenantsQuery request, CancellationToken cancellationToken)
    {
        var tenants = await _context.Tenants
            .Select(t => new GlobalTenantDto
            {
                Id = t.Id,
                Name = t.Name,
                Subdomain = t.Subdomain,
                State = t.State
            })
            .ToListAsync(cancellationToken);

        return Result<List<GlobalTenantDto>>.Success(tenants);
    }
}
