using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

// IGlobalSettingsService + SettingKeys are in the same assembly — no extra using needed.

namespace ChitStack.Application.Features.Orders.Commands.CompleteProvisioning;

public class CompleteProvisioningCommand : IRequest<Result<bool>>
{
    public string OrderReference { get; set; } = string.Empty;
    public string ConnectionString { get; set; } = string.Empty;
    public string PortalUrl { get; set; } = string.Empty;
    public string CompletedBy { get; set; } = string.Empty;
}

public class CompleteProvisioningHandler : IRequestHandler<CompleteProvisioningCommand, Result<bool>>
{
    private readonly IGlobalDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IGlobalSettingsService _settings;

    public CompleteProvisioningHandler(
        IGlobalDbContext context,
        IEmailService emailService,
        IGlobalSettingsService settings)
    {
        _context  = context;
        _emailService = emailService;
        _settings = settings;
    }

    public async Task<Result<bool>> Handle(
        CompleteProvisioningCommand request,
        CancellationToken cancellationToken)
    {
        var order = await _context.TenantOrders
            .Include(o => o.Tenant)
            .FirstOrDefaultAsync(o => o.OrderReference == request.OrderReference, cancellationToken);

        if (order is null)
            return Result<bool>.Failure("Order not found.");

        var now = DateTime.UtcNow;

        order.OrderStatus = "Provisioned";
        order.ProvisionedAt = now;
        order.ConnectionString = request.ConnectionString;

        if (order.Tenant is not null)
        {
            order.Tenant.SubscriptionStatus = "Active";
            order.Tenant.Subdomain = order.TenantKey;
            order.Tenant.ConnectionString = request.ConnectionString;
            order.Tenant.ProvisionedAt = now;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var portalUrl = string.IsNullOrWhiteSpace(request.PortalUrl)
            ? $"https://{order.TenantKey}.chitstack.com"
            : request.PortalUrl;

        var globalPortalUrl = await _settings.GetAsync(
            SettingKeys.Platform.Group,
            SettingKeys.Platform.GlobalPortalBaseUrl,
            cancellationToken) ?? "";

        _ = _emailService.SendAsync(
            order.AdminEmail,
            "Your ChitStack Portal is Ready!",
            BuildWelcomeEmail(order, portalUrl, globalPortalUrl));

        return Result<bool>.Success(true);
    }

    private static string BuildWelcomeEmail(
        ChitStack.Domain.Global.TenantOrder order,
        string portalUrl,
        string globalPortalUrl)
    {
        var orderTrackUrl      = string.IsNullOrWhiteSpace(globalPortalUrl)
            ? string.Empty
            : $"{globalPortalUrl}/orders/{order.OrderReference}";

        var orderTrackSection = string.IsNullOrWhiteSpace(orderTrackUrl) ? string.Empty : $"""
              <p style="margin-top:16px">
                <strong>View your order &amp; subscription details:</strong><br/>
                <a href="{orderTrackUrl}">{orderTrackUrl}</a>
              </p>
              <p style="color:#64748b;font-size:12px">
                After logging in, go to <strong>My Subscription</strong> in the sidebar to view
                your active licenses, annual renewal dates, and renew upcoming items.
              </p>
            """;

        return $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#4f46e5">Your ChitStack Portal is Ready!</h2>
              <p>Dear {order.AdminName},</p>
              <p>Your dedicated ChitStack portal has been set up and is ready to use.</p>
              <table style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;width:100%;background:#f8fafc">
                <tr><td><strong>Portal URL:</strong></td><td><a href="{portalUrl}">{portalUrl}</a></td></tr>
                <tr><td><strong>Username:</strong></td><td>{order.AdminEmail}</td></tr>
                <tr><td><strong>Temp. Password:</strong></td><td>ChitStack@{DateTime.UtcNow.Year}</td></tr>
              </table>
              <p style="margin-top:16px">
                Please log in and change your password immediately.
              </p>
              <p>Your subscription details:</p>
              <ul>
                <li>Company: {order.CompanyName}</li>
                <li>Order Reference: {order.OrderReference}</li>
                <li>Total Amount: &#8377;{order.TotalAmount:N2}</li>
              </ul>
              {orderTrackSection}
              <p style="color:#64748b;font-size:12px">
                ChitStack &mdash; Chit Fund Management Software
              </p>
            </div>
            """;
    }
}
