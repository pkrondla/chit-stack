using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Global;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Affiliates.Commands.AdminAddAffiliate;

public class AdminAddAffiliateCommand : IRequest<Result<AdminAddAffiliateResponse>>
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string Password { get; set; } = string.Empty;
    public decimal? CommissionPercent { get; set; }
    public string AddedBy { get; set; } = string.Empty;
}

public class AdminAddAffiliateResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
}

public class AdminAddAffiliateHandler : IRequestHandler<AdminAddAffiliateCommand, Result<AdminAddAffiliateResponse>>
{
    private readonly IGlobalDbContext _context;
    private readonly IAffiliateCodeGenerator _codeGenerator;
    private readonly IEmailService _emailService;

    public AdminAddAffiliateHandler(
        IGlobalDbContext context,
        IAffiliateCodeGenerator codeGenerator,
        IEmailService emailService)
    {
        _context = context;
        _codeGenerator = codeGenerator;
        _emailService = emailService;
    }

    public async Task<Result<AdminAddAffiliateResponse>> Handle(
        AdminAddAffiliateCommand request,
        CancellationToken cancellationToken)
    {
        if (await _context.Affiliates.AnyAsync(a => a.Email == request.Email, cancellationToken))
            return Result<AdminAddAffiliateResponse>.Failure("An affiliate with this email already exists.");

        string code;
        int attempts = 0;
        do
        {
            code = _codeGenerator.Generate(request.Name);
            attempts++;
            if (attempts > 10)
                return Result<AdminAddAffiliateResponse>.Failure("Could not generate a unique affiliate code.");
        }
        while (await _context.Affiliates.AnyAsync(a => a.Code == code, cancellationToken));

        if (request.CommissionPercent.HasValue && (request.CommissionPercent.Value < 0 || request.CommissionPercent.Value > 100))
            return Result<AdminAddAffiliateResponse>.Failure("Commission percent must be between 0 and 100.");

        var affiliate = new Affiliate
        {
            Code = code,
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            CompanyName = request.CompanyName,
            PasswordHash = request.Password, // TODO: hash
            IsApproved = true,
            CommissionPercent = request.CommissionPercent,
            ApprovedAt = DateTime.UtcNow,
            ApprovedBy = request.AddedBy,
            CreatedBy = request.AddedBy
        };

        _context.Affiliates.Add(affiliate);
        await _context.SaveChangesAsync(cancellationToken);

        _ = _emailService.SendAsync(
            request.Email,
            "Welcome to ChitStack Affiliate Program",
            $"<div style='font-family:sans-serif;max-width:600px;margin:0 auto'>" +
            $"<h2 style='color:#4f46e5'>Welcome to ChitStack Affiliate Program!</h2>" +
            $"<p>Hi {request.Name}, your affiliate account has been created by the admin and is ready to use.</p>" +
            $"<p><strong>Your Affiliate Code:</strong> <code style='background:#f1f5f9;padding:4px 8px;border-radius:4px'>{code}</code></p>" +
            $"<p><strong>Login Email:</strong> {request.Email}<br/>" +
            $"<strong>Password:</strong> {request.Password}</p>" +
            $"<p>Log in to your affiliate portal to start tracking referrals and commissions.</p>" +
            $"<p style='color:#64748b;font-size:12px'>ChitStack — Chit Fund Management Software</p></div>");

        return Result<AdminAddAffiliateResponse>.Success(new AdminAddAffiliateResponse
        {
            Id = affiliate.Id,
            Code = code
        });
    }
}
