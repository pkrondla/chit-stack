using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Affiliates.Queries.GetAffiliateTenants;

public class AffiliateTenantDto
{
    public int TenantId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string SubscriptionStatus { get; set; } = string.Empty;
    public DateTime RegisteredAt { get; set; }
    public string? OrderReference { get; set; }
    public string? OrderStatus { get; set; }
    public decimal? OrderAmount { get; set; }
    public decimal? CommissionAmount { get; set; }
    public string? CommissionStatus { get; set; }
}

public class GetAffiliateTenantsQuery : IRequest<Result<List<AffiliateTenantDto>>>
{
    public int AffiliateId { get; set; }
}

public class GetAffiliateTenantsHandler : IRequestHandler<GetAffiliateTenantsQuery, Result<List<AffiliateTenantDto>>>
{
    private readonly IGlobalDbContext _context;

    public GetAffiliateTenantsHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AffiliateTenantDto>>> Handle(GetAffiliateTenantsQuery request, CancellationToken cancellationToken)
    {
        var tenants = await _context.Tenants
            .AsNoTracking()
            .Where(t => t.AffiliateId == request.AffiliateId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new AffiliateTenantDto
            {
                TenantId = t.Id,
                CompanyName = t.Name,
                ContactEmail = t.ContactEmail,
                SubscriptionStatus = t.SubscriptionStatus,
                RegisteredAt = t.CreatedAt
            })
            .ToListAsync(cancellationToken);

        if (tenants.Count == 0)
            return Result<List<AffiliateTenantDto>>.Success(tenants);

        var tenantIds = tenants.Select(t => t.TenantId).ToList();

        // Get orders and commissions for those tenants
        var orders = await _context.TenantOrders
            .AsNoTracking()
            .Where(o => tenantIds.Contains(o.TenantId) && o.AffiliateId == request.AffiliateId)
            .Include(o => o.Commission)
            .Select(o => new
            {
                o.TenantId,
                o.OrderReference,
                o.OrderStatus,
                o.TotalAmount,
                CommissionAmount = (decimal?)o.Commission!.CommissionAmount,
                CommissionStatus = o.Commission != null ? o.Commission.Status : null
            })
            .ToListAsync(cancellationToken);

        var ordersByTenant = orders.ToDictionary(o => o.TenantId);

        foreach (var tenant in tenants)
        {
            if (ordersByTenant.TryGetValue(tenant.TenantId, out var order))
            {
                tenant.OrderReference = order.OrderReference;
                tenant.OrderStatus = order.OrderStatus;
                tenant.OrderAmount = order.TotalAmount;
                tenant.CommissionAmount = order.CommissionAmount;
                tenant.CommissionStatus = order.CommissionStatus;
            }
        }

        return Result<List<AffiliateTenantDto>>.Success(tenants);
    }
}
