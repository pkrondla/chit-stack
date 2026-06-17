using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Subscriptions.Queries.GetSubscriptionRenewals;

public class SubscriptionRenewalDto
{
    public string ComponentName { get; set; } = string.Empty;
    public string PricingType { get; set; } = string.Empty;   // "Annual" | "AMC"
    public decimal AnnualAmount { get; set; }
    public DateTime ExpiryDate { get; set; }
    public bool IsExpired { get; set; }
    public int DaysUntilExpiry { get; set; }
}

public class GetSubscriptionRenewalsQuery : IRequest<Result<List<SubscriptionRenewalDto>>>
{
    /// <summary>Contact email used during registration / subscription.</summary>
    public string ContactEmail { get; set; } = string.Empty;
}

public class GetSubscriptionRenewalsHandler
    : IRequestHandler<GetSubscriptionRenewalsQuery, Result<List<SubscriptionRenewalDto>>>
{
    private readonly IGlobalDbContext _context;

    public GetSubscriptionRenewalsHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<SubscriptionRenewalDto>>> Handle(
        GetSubscriptionRenewalsQuery request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ContactEmail))
            return Result<List<SubscriptionRenewalDto>>.Failure("Email is required.");

        // Find the most recent confirmed order for this tenant
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.ContactEmail == request.ContactEmail, cancellationToken);

        if (tenant is null)
            return Result<List<SubscriptionRenewalDto>>.Success([]);

        // Get all annual items from confirmed/provisioned orders for this tenant
        var annualItems = await _context.TenantOrders
            .Where(o => o.TenantId == tenant.Id &&
                        (o.OrderStatus == "Confirmed" || o.OrderStatus == "Provisioned"))
            .SelectMany(o => o.Items)
            .Where(i => (i.PricingType == "Annual" || i.PricingType == "AMC")
                        && i.ExpiryDate != null && i.IsActive)
            .OrderByDescending(i => i.ExpiryDate)
            .ToListAsync(cancellationToken);

        // Deduplicate: keep the latest expiry per component name
        var latest = annualItems
            .GroupBy(i => i.ComponentName)
            .Select(g => g.OrderByDescending(i => i.ExpiryDate).First())
            .ToList();

        var now = DateTime.UtcNow;
        var result = latest.Select(i => new SubscriptionRenewalDto
        {
            ComponentName   = i.ComponentName,
            PricingType     = i.PricingType,
            AnnualAmount    = i.LineTotal,
            ExpiryDate      = i.ExpiryDate!.Value,
            IsExpired       = i.ExpiryDate.Value < now,
            DaysUntilExpiry = (int)(i.ExpiryDate.Value - now).TotalDays
        }).ToList();

        return Result<List<SubscriptionRenewalDto>>.Success(result);
    }
}
