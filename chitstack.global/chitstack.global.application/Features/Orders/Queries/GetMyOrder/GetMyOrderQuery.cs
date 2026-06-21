using ChitStack.Application.Common.Interfaces;
using ChitStack.Application.Features.Orders.Queries.GetOrder;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Orders.Queries.GetMyOrder;

public class GetMyOrderQuery : IRequest<Result<OrderDetailDto?>>
{
    public string ContactEmail { get; set; } = string.Empty;
}

public class GetMyOrderHandler : IRequestHandler<GetMyOrderQuery, Result<OrderDetailDto?>>
{
    private readonly IGlobalDbContext _context;

    public GetMyOrderHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrderDetailDto?>> Handle(
        GetMyOrderQuery request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ContactEmail))
            return Result<OrderDetailDto?>.Success(null);

        // Find the tenant whose ContactEmail matches, then get their latest order
        var order = await _context.TenantOrders
            .AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.PaymentTransactions)
            .Include(o => o.Tenant)
            .Where(o => o.Tenant != null && o.Tenant.ContactEmail == request.ContactEmail)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (order is null)
            return Result<OrderDetailDto?>.Success(null);

        var dto = new OrderDetailDto
        {
            Id                 = order.Id,
            OrderReference     = order.OrderReference,
            CompanyName        = order.CompanyName,
            TenantKey          = order.TenantKey,
            AdminName          = order.AdminName,
            AdminEmail         = order.AdminEmail,
            AdminPhone         = order.AdminPhone,
            State              = order.State,
            BillingPeriod      = order.BillingPeriod,
            RecurringTotal     = order.RecurringTotal,
            OneTimeTotal       = order.OneTimeTotal,
            ServiceTotal       = order.ServiceTotal,
            TotalAmount        = order.TotalAmount,
            OrderStatus        = order.OrderStatus,
            CreatedAt          = order.CreatedAt,
            ConfirmedAt        = order.ConfirmedAt,
            ProvisionedAt      = order.ProvisionedAt,
            Items = order.Items.Select(i => new OrderItemDto
            {
                ComponentId       = i.ComponentId,
                ComponentName     = i.ComponentName,
                ComponentCategory = i.ComponentCategory,
                PricingType       = i.PricingType,
                UnitPrice         = i.UnitPrice,
                Quantity          = i.Quantity,
                ExpiryDate        = i.ExpiryDate,
                LineTotal         = i.LineTotal
            }).ToList(),
            PaymentTransactions = order.PaymentTransactions
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new PaymentTransactionDto
                {
                    Id                   = t.Id,
                    TransactionReference = t.TransactionReference,
                    PaymentDate          = t.PaymentDate,
                    Amount               = t.Amount,
                    PaymentMethod        = t.PaymentMethod,
                    BankOrUpiDetails     = t.BankOrUpiDetails,
                    UpdatedBy            = t.UpdatedBy,
                    UpdatedByRole        = t.UpdatedByRole,
                    Status               = t.Status,
                    RejectionReason      = t.RejectionReason,
                    ConfirmedAt          = t.ConfirmedAt
                }).ToList()
        };

        return Result<OrderDetailDto?>.Success(dto);
    }
}
