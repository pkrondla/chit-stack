using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Global;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Orders.Commands.SubmitOrder;

public class OrderItemRequest
{
    public int ComponentId { get; set; }
    /// <summary>Number of training days — only relevant for PricingType = "PerDay".</summary>
    public int? Quantity { get; set; }
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
    public List<OrderItemRequest> Items { get; set; } = [];

    /// <summary>
    /// Renewal orders carry no new License items (licenseTotal = 0), so AMC cannot be
    /// auto-calculated at 25% of zero. Pass the stored AMC unit price from the original
    /// order to preserve the correct annual amount. Null = use auto-calculation.
    /// </summary>
    public decimal? ExplicitAmcAmount { get; set; }

    /// <summary>Optional affiliate referral code entered by the subscriber during checkout.</summary>
    public string? AffiliateCode { get; set; }
}

public class SubmitOrderResponse
{
    public string OrderReference { get; set; } = string.Empty;
    public decimal LicenseTotal { get; set; }
    public decimal AnnualTotal { get; set; }
    public decimal TrainingTotal { get; set; }
    public decimal AmcAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string PaymentUpiId { get; set; } = string.Empty;
    public string PaymentBankName { get; set; } = string.Empty;
    public string PaymentAccountNumber { get; set; } = string.Empty;
    public string PaymentIfsc { get; set; } = string.Empty;
}

public class SubmitOrderHandler : IRequestHandler<SubmitOrderCommand, Result<SubmitOrderResponse>>
{
    private readonly IGlobalDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IGlobalSettingsService _settings;

    public SubmitOrderHandler(
        IGlobalDbContext context,
        IEmailService emailService,
        IGlobalSettingsService settings)
    {
        _context = context;
        _emailService = emailService;
        _settings = settings;
    }

    public async Task<Result<SubmitOrderResponse>> Handle(
        SubmitOrderCommand request,
        CancellationToken cancellationToken)
    {
        var globalTenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.ContactEmail == request.ContactEmail, cancellationToken);

        if (globalTenant is null)
            return Result<SubmitOrderResponse>.Failure(
                "Email not found. Please register first at /register.");

        if (await _context.TenantOrders.AnyAsync(
                o => o.TenantKey == request.TenantKey, cancellationToken))
            return Result<SubmitOrderResponse>.Failure(
                "This subdomain/tenant key is already taken. Please choose another.");

        // Renewals (tenant already Active/Provisioned) are allowed to create new orders.
        // For all other statuses, block if a non-cancelled order already exists.
        if (globalTenant.SubscriptionStatus != "Active")
        {
            var existingOrder = await _context.TenantOrders
                .Where(o => o.TenantId == globalTenant.Id && o.OrderStatus != "Cancelled")
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new { o.OrderReference, o.OrderStatus })
                .FirstOrDefaultAsync(cancellationToken);

            if (existingOrder is not null)
                return Result<SubmitOrderResponse>.Failure(
                    $"You already have an active order ({existingOrder.OrderReference}) with status '{existingOrder.OrderStatus}'. " +
                    "Please track your existing order or contact support.");
        }

        var componentIds = request.Items.Select(i => i.ComponentId).ToList();
        var components = await _context.SoftwareComponents
            .Where(c => componentIds.Contains(c.Id) && c.IsActive)
            .ToListAsync(cancellationToken);

        var amcPct = decimal.Parse(
            await _settings.GetAsync(SettingKeys.Platform.Group, SettingKeys.Platform.AMCPercentage, cancellationToken) ?? "25") / 100m;

        var expiryDate = DateTime.UtcNow.AddYears(1);
        decimal licenseTotal = 0, annualTotal = 0, trainingTotal = 0;
        var orderItems = new List<TenantOrderItem>();

        foreach (var itemReq in request.Items)
        {
            var comp = components.FirstOrDefault(c => c.Id == itemReq.ComponentId);
            if (comp is null) continue;

            switch (comp.PricingType)
            {
                case "License":
                    licenseTotal += comp.LicensePrice;
                    orderItems.Add(new TenantOrderItem
                    {
                        ComponentId   = comp.Id,
                        ComponentName = comp.Name,
                        ComponentCategory = comp.Category,
                        PricingType = "License",
                        UnitPrice   = comp.LicensePrice,
                        Quantity    = 1,
                        LineTotal   = comp.LicensePrice,
                        ExpiryDate  = null,
                        CreatedBy   = request.ContactEmail
                    });
                    break;

                case "Annual":
                    annualTotal += comp.AnnualPrice;
                    orderItems.Add(new TenantOrderItem
                    {
                        ComponentId   = comp.Id,
                        ComponentName = comp.Name,
                        ComponentCategory = comp.Category,
                        PricingType = "Annual",
                        UnitPrice   = comp.AnnualPrice,
                        Quantity    = 1,
                        LineTotal   = comp.AnnualPrice,
                        ExpiryDate  = expiryDate,
                        CreatedBy   = request.ContactEmail
                    });
                    break;

                case "PerDay":
                    var days = Math.Max(1, itemReq.Quantity ?? 1);
                    var lineTotal = comp.DailyPrice * days;
                    trainingTotal += lineTotal;
                    orderItems.Add(new TenantOrderItem
                    {
                        ComponentId   = comp.Id,
                        ComponentName = comp.Name,
                        ComponentCategory = comp.Category,
                        PricingType = "PerDay",
                        UnitPrice   = comp.DailyPrice,
                        Quantity    = days,
                        LineTotal   = lineTotal,
                        ExpiryDate  = null,
                        CreatedBy   = request.ContactEmail
                    });
                    break;
            }
        }

        // For renewal orders, use the explicitly passed AMC amount (licenseTotal is 0).
        // For new orders, calculate AMC as amcPct % of licenseTotal.
        var amcAmount = request.ExplicitAmcAmount.HasValue
            ? request.ExplicitAmcAmount.Value
            : Math.Round(licenseTotal * amcPct, 2);

        if (amcAmount > 0)
        {
            // Use a sentinel ComponentId = 0 (AMC is not a catalog item)
            var amcComp = await _context.SoftwareComponents
                .FirstOrDefaultAsync(c => c.Name == "Chit Fund Management Software", cancellationToken);

            orderItems.Add(new TenantOrderItem
            {
                ComponentId   = amcComp?.Id ?? componentIds.First(),
                ComponentName = $"Annual Maintenance Contract ({amcPct * 100:0}% of license)",
                ComponentCategory = "AMC",
                PricingType = "AMC",
                UnitPrice   = amcAmount,
                Quantity    = 1,
                LineTotal   = amcAmount,
                ExpiryDate  = expiryDate,
                CreatedBy   = request.ContactEmail
            });
            annualTotal += amcAmount;
        }

        var year = DateTime.UtcNow.Year;
        var seq  = await _context.TenantOrders.CountAsync(o => o.CreatedAt.Year == year, cancellationToken) + 1;
        var orderRef = $"CS-{year}-{seq:D4}";
        var grandTotal = licenseTotal + annualTotal + trainingTotal;

        // Resolve optional affiliate code
        int? affiliateId = null;
        if (!string.IsNullOrWhiteSpace(request.AffiliateCode))
        {
            var affiliate = await _context.Affiliates
                .FirstOrDefaultAsync(a => a.Code == request.AffiliateCode && a.IsApproved && a.IsActive, cancellationToken);
            if (affiliate is not null)
            {
                affiliateId = affiliate.Id;
                // Link affiliate to tenant if not already linked
                if (globalTenant.AffiliateId is null)
                    globalTenant.AffiliateId = affiliate.Id;
            }
        }

        var order = new TenantOrder
        {
            OrderReference = orderRef,
            TenantId       = globalTenant.Id,
            CompanyName    = request.CompanyName,
            TenantKey      = request.TenantKey,
            AdminName      = request.AdminName,
            AdminEmail     = request.AdminEmail,
            AdminPhone     = request.AdminPhone,
            State          = request.State,
            BillingPeriod  = "License",   // kept for DB column, no longer used for pricing
            RecurringTotal = annualTotal,
            OneTimeTotal   = licenseTotal,
            ServiceTotal   = trainingTotal,
            TotalAmount    = grandTotal,
            OrderStatus    = "Submitted",
            AffiliateId    = affiliateId,
            CreatedBy      = request.ContactEmail,
            Items          = orderItems
        };

        globalTenant.SubscriptionStatus = "OrderSubmitted";
        _context.TenantOrders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        var globalPortal = await _settings.GetAsync(SettingKeys.Platform.Group, SettingKeys.Platform.GlobalPortalBaseUrl, cancellationToken) ?? "";
        var upiId        = await _settings.GetAsync(SettingKeys.Platform.Group, SettingKeys.Platform.PaymentUpiId, cancellationToken) ?? "";
        var bankName     = await _settings.GetAsync(SettingKeys.Platform.Group, SettingKeys.Platform.PaymentBankName, cancellationToken) ?? "";
        var account      = await _settings.GetAsync(SettingKeys.Platform.Group, SettingKeys.Platform.PaymentAccountNumber, cancellationToken) ?? "";
        var ifsc         = await _settings.GetAsync(SettingKeys.Platform.Group, SettingKeys.Platform.PaymentIfsc, cancellationToken) ?? "";

        _ = _emailService.SendAsync(
            request.AdminEmail,
            $"ChitStack Order Confirmed — {orderRef}",
            BuildOrderEmail(order, globalPortal, upiId, bankName, account, ifsc));

        var adminEmail = await _settings.GetAsync(SettingKeys.Platform.Group, SettingKeys.Platform.AdminEmail, cancellationToken);
        if (!string.IsNullOrWhiteSpace(adminEmail))
            _ = _emailService.SendAsync(
                adminEmail,
                $"New Order Received — {orderRef}",
                $"<p>Company: {request.CompanyName}<br/>Amount: ₹{grandTotal:N2}<br/>" +
                $"<a href='{globalPortal}/admin/orders'>View in Admin Portal</a></p>");

        return Result<SubmitOrderResponse>.Success(new SubmitOrderResponse
        {
            OrderReference       = orderRef,
            LicenseTotal         = licenseTotal,
            AnnualTotal          = annualTotal,
            TrainingTotal        = trainingTotal,
            AmcAmount            = amcAmount,
            TotalAmount          = grandTotal,
            PaymentUpiId         = upiId,
            PaymentBankName      = bankName,
            PaymentAccountNumber = account,
            PaymentIfsc          = ifsc
        });
    }

    private static string BuildOrderEmail(TenantOrder order, string portalUrl,
        string upiId, string bankName, string account, string ifsc)
    {
        var rows = string.Join("", order.Items.Select(i =>
            $"<tr>" +
            $"<td style='padding:8px;border:1px solid #e2e8f0'>{i.ComponentName}" +
            $"{(i.Quantity > 1 ? $" × {i.Quantity} days" : "")}</td>" +
            $"<td style='padding:8px;border:1px solid #e2e8f0;text-align:right'>" +
            $"{(i.PricingType is "Annual" or "AMC" ? "/year" : i.PricingType == "PerDay" ? "" : "one-time")}</td>" +
            $"<td style='padding:8px;border:1px solid #e2e8f0;text-align:right'>₹{i.LineTotal:N2}</td>" +
            $"</tr>"));

        return $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#4f46e5">Order Received — {order.OrderReference}</h2>
              <p>Thank you for your order. Please complete the payment to proceed.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr style="background:#f8fafc">
                  <th style="text-align:left;padding:8px;border:1px solid #e2e8f0">Item</th>
                  <th style="padding:8px;border:1px solid #e2e8f0">Billing</th>
                  <th style="text-align:right;padding:8px;border:1px solid #e2e8f0">Amount</th>
                </tr>
                {rows}
                <tr style="font-weight:bold;background:#f8fafc">
                  <td colspan="2" style="padding:8px;border:1px solid #e2e8f0">Total Due</td>
                  <td style="text-align:right;padding:8px;border:1px solid #e2e8f0">₹{order.TotalAmount:N2}</td>
                </tr>
              </table>
              <h3>Payment Instructions</h3>
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
