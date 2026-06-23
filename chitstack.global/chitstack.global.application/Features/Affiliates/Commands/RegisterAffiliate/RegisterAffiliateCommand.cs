using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Global;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Affiliates.Commands.RegisterAffiliate;

public class RegisterAffiliateCommand : IRequest<Result<RegisterAffiliateResponse>>
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string Password { get; set; } = string.Empty;
}

public class RegisterAffiliateResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class RegisterAffiliateHandler : IRequestHandler<RegisterAffiliateCommand, Result<RegisterAffiliateResponse>>
{
    private readonly IGlobalDbContext _context;
    private readonly IAffiliateCodeGenerator _codeGenerator;
    private readonly IEmailService _emailService;
    private readonly IGlobalSettingsService _settings;

    public RegisterAffiliateHandler(
        IGlobalDbContext context,
        IAffiliateCodeGenerator codeGenerator,
        IEmailService emailService,
        IGlobalSettingsService settings)
    {
        _context = context;
        _codeGenerator = codeGenerator;
        _emailService = emailService;
        _settings = settings;
    }

    public async Task<Result<RegisterAffiliateResponse>> Handle(
        RegisterAffiliateCommand request,
        CancellationToken cancellationToken)
    {
        if (await _context.Affiliates.AnyAsync(a => a.Email == request.Email, cancellationToken))
            return Result<RegisterAffiliateResponse>.Failure("An affiliate with this email already exists.");

        // Generate a unique code
        string code;
        int attempts = 0;
        do
        {
            code = _codeGenerator.Generate(request.Name);
            attempts++;
            if (attempts > 10)
                return Result<RegisterAffiliateResponse>.Failure("Could not generate a unique affiliate code. Please try again.");
        }
        while (await _context.Affiliates.AnyAsync(a => a.Code == code, cancellationToken));

        var affiliate = new Affiliate
        {
            Code = code,
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            CompanyName = request.CompanyName,
            PasswordHash = request.Password, // TODO: hash
            IsApproved = false,
            CreatedBy = request.Email
        };

        _context.Affiliates.Add(affiliate);
        await _context.SaveChangesAsync(cancellationToken);

        var adminEmail = await _settings.GetAsync(SettingKeys.Platform.Group, SettingKeys.Platform.AdminEmail, cancellationToken);
        if (!string.IsNullOrWhiteSpace(adminEmail))
        {
            _ = _emailService.SendAsync(
                adminEmail,
                $"New Affiliate Registration: {request.Name}",
                $"<p>A new affiliate has registered and is awaiting approval.</p>" +
                $"<p><strong>Name:</strong> {request.Name}<br/>" +
                $"<strong>Email:</strong> {request.Email}<br/>" +
                $"<strong>Phone:</strong> {request.Phone}<br/>" +
                $"<strong>Company:</strong> {request.CompanyName ?? "—"}<br/>" +
                $"<strong>Code:</strong> {code}</p>");
        }

        _ = _emailService.SendAsync(
            request.Email,
            "Welcome to ChitStack Affiliate Program",
            $"<div style='font-family:sans-serif;max-width:600px;margin:0 auto'>" +
            $"<h2 style='color:#4f46e5'>Welcome, {request.Name}!</h2>" +
            $"<p>Your affiliate registration has been received. Your application is under review.</p>" +
            $"<p>You will receive an email once your account is approved.</p>" +
            $"<p><strong>Your Affiliate Code:</strong> <code>{code}</code></p>" +
            $"<p style='color:#64748b;font-size:12px'>ChitStack — Chit Fund Management Software</p></div>");

        return Result<RegisterAffiliateResponse>.Success(new RegisterAffiliateResponse
        {
            Id = affiliate.Id,
            Code = code,
            Message = "Registration successful. Your account is pending admin approval."
        });
    }
}
