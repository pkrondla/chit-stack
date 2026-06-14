using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Orders.Queries.GetOrder;

public class PaymentTransactionDto
{
    public int Id { get; set; }
    public string TransactionReference { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? BankOrUpiDetails { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
    public string UpdatedByRole { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public DateTime? ConfirmedAt { get; set; }
}

public class OrderItemDto
{
    public int ComponentId { get; set; }
    public string ComponentName { get; set; } = string.Empty;
    public string ComponentCategory { get; set; } = string.Empty;
    public string PricingType { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int? EstimatedHours { get; set; }
    public decimal LineTotal { get; set; }
}

public class OrderDetailDto
{
    public int Id { get; set; }
    public string OrderReference { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string TenantKey { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string? AdminPhone { get; set; }
    public string State { get; set; } = string.Empty;
    public string BillingPeriod { get; set; } = string.Empty;
    public decimal RecurringTotal { get; set; }
    public decimal OneTimeTotal { get; set; }
    public decimal ServiceTotal { get; set; }
    public decimal TotalAmount { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? ProvisionedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = [];
    public List<PaymentTransactionDto> PaymentTransactions { get; set; } = [];
}

public class GetOrderQuery : IRequest<Result<OrderDetailDto>>
{
    public string OrderReference { get; set; } = string.Empty;
}

public class GetOrderHandler : IRequestHandler<GetOrderQuery, Result<OrderDetailDto>>
{
    private readonly IGlobalDbContext _context;

    public GetOrderHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrderDetailDto>> Handle(
        GetOrderQuery request,
        CancellationToken cancellationToken)
    {
        var order = await _context.TenantOrders
            .AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.PaymentTransactions)
            .FirstOrDefaultAsync(o => o.OrderReference == request.OrderReference, cancellationToken);

        if (order is null)
            return Result<OrderDetailDto>.Failure("Order not found.");

        var dto = new OrderDetailDto
        {
            Id = order.Id,
            OrderReference = order.OrderReference,
            CompanyName = order.CompanyName,
            TenantKey = order.TenantKey,
            AdminName = order.AdminName,
            AdminEmail = order.AdminEmail,
            AdminPhone = order.AdminPhone,
            State = order.State,
            BillingPeriod = order.BillingPeriod,
            RecurringTotal = order.RecurringTotal,
            OneTimeTotal = order.OneTimeTotal,
            ServiceTotal = order.ServiceTotal,
            TotalAmount = order.TotalAmount,
            OrderStatus = order.OrderStatus,
            CreatedAt = order.CreatedAt,
            ConfirmedAt = order.ConfirmedAt,
            ProvisionedAt = order.ProvisionedAt,
            Items = order.Items.Select(i => new OrderItemDto
            {
                ComponentId = i.ComponentId,
                ComponentName = i.ComponentName,
                ComponentCategory = i.ComponentCategory,
                PricingType = i.PricingType,
                UnitPrice = i.UnitPrice,
                EstimatedHours = i.EstimatedHours,
                LineTotal = i.LineTotal
            }).ToList(),
            PaymentTransactions = order.PaymentTransactions
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new PaymentTransactionDto
                {
                    Id = t.Id,
                    TransactionReference = t.TransactionReference,
                    PaymentDate = t.PaymentDate,
                    Amount = t.Amount,
                    PaymentMethod = t.PaymentMethod,
                    BankOrUpiDetails = t.BankOrUpiDetails,
                    UpdatedBy = t.UpdatedBy,
                    UpdatedByRole = t.UpdatedByRole,
                    Status = t.Status,
                    RejectionReason = t.RejectionReason,
                    ConfirmedAt = t.ConfirmedAt
                }).ToList()
        };

        return Result<OrderDetailDto>.Success(dto);
    }
}
