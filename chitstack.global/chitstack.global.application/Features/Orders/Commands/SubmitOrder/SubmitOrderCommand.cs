using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Global;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ChitStack.Application.Features.Orders.Commands.SubmitOrder;

public class OrderItemRequest
{
    public int ComponentId { get; set; }
    public int? EstimatedHours { get; set; }
}

public class SubmitOrderCommand : IRequest<Result<SubmitOrderResponse>>
{
    public string ContactEmail { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string TenantKey { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string? AdminPhone { get; set; }
    public string State { get; set; } = "Karnataka";
    public string BillingPeriod { get; set; } = "Monthly";
    public List<OrderItemRequest> Items { get; set; } = [];
}

public class SubmitOrderResponse
{
    public string OrderReference { get; set; } = string.Empty;
    public decimal RecurringTotal { get; set; }
    public decimal OneTimeTotal { get; set; }
    public decimal ServiceTotal { get; set; }
    public decimal TotalAmount { get; set; }
    public string BillingPeriod { get; set; } = string.Empty;
    public string PaymentUpiId { get; set; } = string.Empty;
    public string PaymentBankName { get; set; } = string.Empty;
    public string PaymentAccountNumber { get; set; } = string.Empty;
    public string PaymentIfsc { get; set; } = string.Empty;
}

public class SubmitOrderHandler : IRequestHandler<SubmitOrderCommand, Result<SubmitOrderResponse>>
{
    private readonly IGlobalDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public SubmitOrderHandler(
        IGlobalDbContext context,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<Result<SubmitOrderResponse>> Handle(
        SubmitOrderCommand request,
        CancellationToken cancellationToken)
    {
        // Look up GlobalTenant by email
        var globalTenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.ContactEmail == request.ContactEmail, cancellationToken);

        if (globalTenant is null)
            return Result<SubmitOrderResponse>.Failure(
                "Email not found. Please register first at /register.");

        // Validate desired TenantKey uniqueness
        if (await _context.TenantOrders.AnyAsync(
                o => o.TenantKey == request.TenantKey, cancellationToken))
            return Result<SubmitOrderResponse>.Failure(
                "This subdomain/tenant key is already taken. Please choose another.");

        // Load selected components
        var componentIds = request.Items.Select(i => i.ComponentId).ToList();
        var components = await _context.SoftwareComponents
            .Where(c => componentIds.Contains(c.Id) && c.IsActive)
            .ToListAsync(cancellationToken);

        // Build order items and calculate totals
        decimal recurringTotal = 0, oneTimeTotal = 0, serviceTotal = 0;
        var orderItems = new List<TenantOrderItem>();

        foreach (var itemReq in request.Items)
        {
            var comp = components.FirstOrDefault(c => c.Id == itemReq.ComponentId);
            if (comp is null) continue;

            decimal unitPrice;
            decimal lineTotal;

            switch (comp.PricingType)
            {
                case "License":
                    unitPrice = comp.LicensePrice;
                    lineTotal = unitPrice;
                    oneTimeTotal += lineTotal;
                    break;

                case "Hourly":
                    unitPrice = comp.HourlyPrice;
                    var hours = itemReq.EstimatedHours ?? 1;
                    lineTotal = unitPrice * hours;
                    serviceTotal += lineTotal;
                    break;

                default: // "Monthly"
                    unitPrice = comp.GetRecurringPrice(request.BillingPeriod);
                    lineTotal = unitPrice;
                    if (comp.Category == "Service")
                        serviceTotal += lineTotal;
                    else
                        recurringTotal += lineTotal;
                    break;
            }

            orderItems.Add(new TenantOrderItem
            {
                ComponentId = comp.Id,
                ComponentName = comp.Name,
                ComponentCategory = comp.Category,
                PricingType = comp.PricingType,
                UnitPrice = unitPrice,
                EstimatedHours = comp.PricingType == "Hourly" ? itemReq.EstimatedHours : null,
                LineTotal = lineTotal,
                CreatedBy = request.ContactEmail
            });
        }

        // Generate order reference CS-YYYY-NNNN
        var year = DateTime.UtcNow.Year;
        var seq = await _context.TenantOrders
            .CountAsync(o => o.CreatedAt.Year == year, cancellationToken) + 1;
        var orderRef = $"CS-{year}-{seq:D4}";

        var order = new TenantOrder
        {
            OrderReference = orderRef,
            TenantId = globalTenant.Id,
            CompanyName = request.CompanyName,
            TenantKey = request.TenantKey,
            AdminName = request.AdminName,
            AdminEmail = request.AdminEmail,
            AdminPhone = request.AdminPhone,
            State = request.State,
            BillingPeriod = request.BillingPeriod,
            RecurringTotal = recurringTotal,
            OneTimeTotal = oneTimeTotal,
            ServiceTotal = serviceTotal,
            TotalAmount = recurringTotal + oneTimeTotal + serviceTotal,
            OrderStatus = "Submitted",
            CreatedBy = request.ContactEmail,
            Items = orderItems
        };

        globalTenant.SubscriptionStatus = "OrderSubmitted";
        _context.TenantOrders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        // Email tenant
        var globalPortal = _configuration["Platform:GlobalPortalBaseUrl"] ?? "";
        var upiId = _configuration["Platform:PaymentUpiId"] ?? "";
        var bankName = _configuration["Platform:PaymentBankName"] ?? "";
        var account = _configuration["Platform:PaymentAccountNumber"] ?? "";
        var ifsc = _configuration["Platform:PaymentIfsc"] ?? "";

        _ = _emailService.SendAsync(
            request.AdminEmail,
            $"ChitStack Order Confirmed — {orderRef}",
            BuildOrderEmail(order, globalPortal, upiId, bankName, account, ifsc));

        // Notify admin
        var adminEmail = _configuration["Platform:AdminEmail"];
        if (!string.IsNullOrWhiteSpace(adminEmail))
        {
            _ = _emailService.SendAsync(
                adminEmail,
                $"New Order Received — {orderRef}",
                $"<p>Company: {request.CompanyName}<br/>Amount: ₹{order.TotalAmount:N2}<br/>" +
                $"<a href='{globalPortal}/admin/orders'>View in Admin Portal</a></p>");
        }

        return Result<SubmitOrderResponse>.Success(new SubmitOrderResponse
        {
            OrderReference = orderRef,
            RecurringTotal = recurringTotal,
            OneTimeTotal = oneTimeTotal,
            ServiceTotal = serviceTotal,
            TotalAmount = order.TotalAmount,
            BillingPeriod = request.BillingPeriod,
            PaymentUpiId = upiId,
            PaymentBankName = bankName,
            PaymentAccountNumber = account,
            PaymentIfsc = ifsc
        });
    }

    private static string BuildOrderEmail(
        TenantOrder order,
        string portalUrl,
        string upiId,
        string bankName,
        string account,
        string ifsc)
    {
        return $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#4f46e5">Order Received — {order.OrderReference}</h2>
              <p>Thank you for your order. Please complete the payment to proceed.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr style="background:#f8fafc">
                  <th style="text-align:left;padding:8px;border:1px solid #e2e8f0">Item</th>
                  <th style="text-align:right;padding:8px;border:1px solid #e2e8f0">Amount</th>
                </tr>
                {string.Join("", order.Items.Select(i =>
                    $"<tr><td style='padding:8px;border:1px solid #e2e8f0'>{i.ComponentName}</td>" +
                    $"<td style='text-align:right;padding:8px;border:1px solid #e2e8f0'>₹{i.LineTotal:N2}</td></tr>"))}
                <tr style="font-weight:bold;background:#f8fafc">
                  <td style="padding:8px;border:1px solid #e2e8f0">Total</td>
                  <td style="text-align:right;padding:8px;border:1px solid #e2e8f0">₹{order.TotalAmount:N2}</td>
                </tr>
              </table>
              <h3>Payment Instructions</h3>
              <p>Please transfer ₹{order.TotalAmount:N2} using any of the following methods:</p>
              <ul>
                <li><strong>UPI:</strong> {upiId}</li>
                <li><strong>Bank:</strong> {bankName} | A/C: {account} | IFSC: {ifsc}</li>
              </ul>
              <p>After payment, enter your transaction details at:<br/>
              <a href="{portalUrl}/orders/{order.OrderReference}/payment">{portalUrl}/orders/{order.OrderReference}/payment</a></p>
              <p style="color:#64748b;font-size:12px">Order Reference: {order.OrderReference}</p>
            </div>
            """;
    }
}
