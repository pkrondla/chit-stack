using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.GlobalTenants.Queries.GetGlobalTenants;

public class GlobalTenantDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string SubscriptionStatus { get; set; } = string.Empty;
    public DateTime TrialEndDate { get; set; }
    public string ContactEmail { get; set; } = string.Empty;
    public string? ContactPhone { get; set; }
    public DateTime? ProvisionedAt { get; set; }
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
                State = t.State,
                SubscriptionStatus = t.SubscriptionStatus,
                TrialEndDate = t.TrialEndDate,
                ContactEmail = t.ContactEmail,
                ContactPhone = t.ContactPhone,
                ProvisionedAt = t.ProvisionedAt
            })
            .ToListAsync(cancellationToken);

        return Result<List<GlobalTenantDto>>.Success(tenants);
    }
}
