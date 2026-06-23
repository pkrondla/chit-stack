using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Affiliates.Commands.ApproveAffiliate;

public class ApproveAffiliateCommand : IRequest<Result<bool>>
{
    public int AffiliateId { get; set; }
    public bool Approve { get; set; } = true;
    public string ApprovedBy { get; set; } = string.Empty;
}

public class ApproveAffiliateHandler : IRequestHandler<ApproveAffiliateCommand, Result<bool>>
{
    private readonly IGlobalDbContext _context;
    private readonly IEmailService _emailService;

    public ApproveAffiliateHandler(IGlobalDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<Result<bool>> Handle(ApproveAffiliateCommand request, CancellationToken cancellationToken)
    {
        var affiliate = await _context.Affiliates
            .FirstOrDefaultAsync(a => a.Id == request.AffiliateId, cancellationToken);

        if (affiliate is null)
            return Result<bool>.Failure("Affiliate not found.");

        affiliate.IsApproved = request.Approve;
        affiliate.IsActive = request.Approve;
        affiliate.ApprovedAt = request.Approve ? DateTime.UtcNow : null;
        affiliate.ApprovedBy = request.Approve ? request.ApprovedBy : null;
        affiliate.LastModifiedAt = DateTime.UtcNow;
        affiliate.LastModifiedBy = request.ApprovedBy;

        await _context.SaveChangesAsync(cancellationToken);

        if (request.Approve)
        {
            _ = _emailService.SendAsync(
                affiliate.Email,
                "ChitStack Affiliate Account Approved",
                $"<div style='font-family:sans-serif;max-width:600px;margin:0 auto'>" +
                $"<h2 style='color:#4f46e5'>Your Affiliate Account is Approved!</h2>" +
                $"<p>Hi {affiliate.Name}, congratulations! Your affiliate account has been approved.</p>" +
                $"<p><strong>Your Affiliate Code:</strong> <code style='background:#f1f5f9;padding:4px 8px;border-radius:4px'>{affiliate.Code}</code></p>" +
                $"<p>You can now log in to your affiliate portal to start referring new clients.</p>" +
                $"<p style='color:#64748b;font-size:12px'>ChitStack — Chit Fund Management Software</p></div>");
        }
        else
        {
            _ = _emailService.SendAsync(
                affiliate.Email,
                "ChitStack Affiliate Account Update",
                $"<p>Hi {affiliate.Name}, your affiliate account has been suspended. Please contact support for more details.</p>");
        }

        return Result<bool>.Success(true);
    }
}
