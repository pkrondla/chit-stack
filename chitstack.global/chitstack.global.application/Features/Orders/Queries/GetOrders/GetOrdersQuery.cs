using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Orders.Queries.GetOrders;

public class OrderSummaryDto
{
    public int Id { get; set; }
    public string OrderReference { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string TenantKey { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string BillingPeriod { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }

    public int? AffiliateId { get; set; }
    public string? AffiliateCode { get; set; }
    public string? AffiliateName { get; set; }
}

public class GetOrdersQuery : IRequest<Result<List<OrderSummaryDto>>>
{
    public string? StatusFilter { get; set; }
}

public class GetOrdersHandler : IRequestHandler<GetOrdersQuery, Result<List<OrderSummaryDto>>>
{
    private readonly IGlobalDbContext _context;

    public GetOrdersHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<OrderSummaryDto>>> Handle(
        GetOrdersQuery request,
        CancellationToken cancellationToken)
    {
        var baseQuery = _context.TenantOrders
            .AsNoTracking()
            .Include(o => o.PaymentTransactions)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.StatusFilter))
            baseQuery = baseQuery.Where(o => o.OrderStatus == request.StatusFilter);

        var orders = await baseQuery
            .Include(o => o.Affiliate)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderSummaryDto
            {
                Id = o.Id,
                OrderReference = o.OrderReference,
                CompanyName = o.CompanyName,
                TenantKey = o.TenantKey,
                AdminEmail = o.AdminEmail,
                BillingPeriod = o.BillingPeriod,
                TotalAmount = o.TotalAmount,
                OrderStatus = o.OrderStatus,
                PaymentStatus = o.PaymentTransactions
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => t.Status)
                    .FirstOrDefault() ?? "None",
                CreatedAt = o.CreatedAt,
                ConfirmedAt = o.ConfirmedAt,
                AffiliateId = o.AffiliateId,
                AffiliateCode = o.Affiliate != null ? o.Affiliate.Code : null,
                AffiliateName = o.Affiliate != null ? o.Affiliate.Name : null
            })
            .ToListAsync(cancellationToken);

        return Result<List<OrderSummaryDto>>.Success(orders);
    }
}
