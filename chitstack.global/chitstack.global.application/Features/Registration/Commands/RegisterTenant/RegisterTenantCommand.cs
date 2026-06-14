using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Global;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ChitStack.Application.Features.Registration.Commands.RegisterTenant;

public class RegisterTenantCommand : IRequest<Result<RegisterTenantResponse>>
{
    public string CompanyName { get; set; } = string.Empty;
    public string State { get; set; } = "Karnataka";
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string AdminFullName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterTenantResponse
{
    public int TenantId { get; set; }
    public string DemoPortalUrl { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public DateTime TrialEndDate { get; set; }
}

public class RegisterTenantHandler : IRequestHandler<RegisterTenantCommand, Result<RegisterTenantResponse>>
{
    private readonly IGlobalDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IDemoStampService _demoStampService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RegisterTenantHandler> _logger;

    public RegisterTenantHandler(
        IGlobalDbContext context,
        IEmailService emailService,
        IDemoStampService demoStampService,
        IConfiguration configuration,
        ILogger<RegisterTenantHandler> logger)
    {
        _context = context;
        _emailService = emailService;
        _demoStampService = demoStampService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<Result<RegisterTenantResponse>> Handle(
        RegisterTenantCommand request,
        CancellationToken cancellationToken)
    {
        // Validate email uniqueness
        if (await _context.Tenants.AnyAsync(
                t => t.ContactEmail == request.ContactEmail,
                cancellationToken))
        {
            return Result<RegisterTenantResponse>.Failure(
                "This email is already registered. Please log in to the demo portal.");
        }

        var trialDays = int.Parse(_configuration["DemoStamp:TrialDays"] ?? "30");
        var now = DateTime.UtcNow;
        var trialEnd = now.AddDays(trialDays);

        // Create GlobalTenant record
        var tenant = new GlobalTenant
        {
            Name = request.CompanyName,
            Subdomain = string.Empty,          // assigned at subscription time
            State = request.State,
            ContactEmail = request.ContactEmail,
            ContactPhone = request.ContactPhone,
            SubscriptionStatus = "DemoAccess",
            TrialStartDate = now,
            TrialEndDate = trialEnd,
            ConnectionString = string.Empty,
            CreatedBy = "Registration"
        };

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync(cancellationToken);

        // Create trial user in the demo stamp DB
        var demoPortalUrl = _configuration["DemoStamp:DemoPortalUrl"] ?? "http://localhost:5173";

        await _demoStampService.CreateDemoUserAsync(
            request.ContactEmail,
            request.Password,
            request.AdminFullName,
            trialEnd,
            cancellationToken);

        // Send welcome email (fire-and-forget; failure doesn't break registration)
        _ = SendWelcomeEmailAsync(
            request.ContactEmail,
            request.AdminFullName,
            demoPortalUrl,
            request.ContactEmail,
            trialEnd);

        // Notify platform admin
        var adminEmail = _configuration["Platform:AdminEmail"];
        if (!string.IsNullOrWhiteSpace(adminEmail))
        {
            _ = _emailService.SendAsync(
                adminEmail,
                $"New Trial Registration: {request.CompanyName}",
                $"<p>A new tenant has registered for a trial.</p>" +
                $"<p><strong>Company:</strong> {request.CompanyName}<br/>" +
                $"<strong>Contact:</strong> {request.ContactEmail}<br/>" +
                $"<strong>Trial ends:</strong> {trialEnd:dd MMM yyyy}</p>");
        }

        return Result<RegisterTenantResponse>.Success(new RegisterTenantResponse
        {
            TenantId = tenant.Id,
            DemoPortalUrl = demoPortalUrl,
            Username = request.ContactEmail,
            TrialEndDate = trialEnd
        });
    }

    private async Task SendWelcomeEmailAsync(
        string to,
        string fullName,
        string portalUrl,
        string username,
        DateTime trialEnd)
    {
        var subject = "Welcome to ChitStack — Your Trial Has Started!";
        var body = $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#4f46e5">Welcome to ChitStack, {fullName}!</h2>
              <p>Your 30-day free trial has started. Explore all features on our shared demo portal.</p>
              <table style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;width:100%;background:#f8fafc">
                <tr><td><strong>Demo Portal:</strong></td><td><a href="{portalUrl}">{portalUrl}</a></td></tr>
                <tr><td><strong>Username:</strong></td><td>{username}</td></tr>
                <tr><td><strong>Trial Ends:</strong></td><td>{trialEnd:dd MMM yyyy}</td></tr>
              </table>
              <p style="margin-top:24px">
                When you are ready to get your own dedicated portal,
                <a href="{portalUrl}/subscribe" style="color:#4f46e5">click here to subscribe</a>.
              </p>
              <p style="color:#64748b;font-size:12px">ChitStack &mdash; Chit Fund Management Software</p>
            </div>
            """;

        await _emailService.SendAsync(to, subject, body);
    }
}
