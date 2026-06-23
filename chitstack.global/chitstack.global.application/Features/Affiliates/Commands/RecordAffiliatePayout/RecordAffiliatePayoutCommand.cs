using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Global;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Affiliates.Commands.RecordAffiliatePayout;

public class RecordAffiliatePayoutCommand : IRequest<Result<int>>
{
    public int AffiliateId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? PaymentReference { get; set; }
    public string? Notes { get; set; }
    /// <summary>Commission IDs to mark as paid with this payout. If empty, all pending commissions up to Amount are linked.</summary>
    public List<int> CommissionIds { get; set; } = [];
    public string CreatedBy { get; set; } = string.Empty;
}

public class RecordAffiliatePayoutHandler : IRequestHandler<RecordAffiliatePayoutCommand, Result<int>>
{
    private readonly IGlobalDbContext _context;
    private readonly IEmailService _emailService;

    public RecordAffiliatePayoutHandler(IGlobalDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<Result<int>> Handle(RecordAffiliatePayoutCommand request, CancellationToken cancellationToken)
    {
        var affiliate = await _context.Affiliates
            .FirstOrDefaultAsync(a => a.Id == request.AffiliateId, cancellationToken);

        if (affiliate is null)
            return Result<int>.Failure("Affiliate not found.");

        if (request.Amount <= 0)
            return Result<int>.Failure("Payout amount must be greater than zero.");

        var payout = new AffiliatePayout
        {
            AffiliateId = request.AffiliateId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            PaymentReference = request.PaymentReference,
            Notes = request.Notes,
            Status = "Completed",
            CreatedBy = request.CreatedBy
        };

        _context.AffiliatePayouts.Add(payout);
        await _context.SaveChangesAsync(cancellationToken);

        // Link specified commissions (or all pending if none specified)
        IQueryable<AffiliateCommission> commissionQuery = _context.AffiliateCommissions
            .Where(c => c.AffiliateId == request.AffiliateId && c.Status == "Pending");

        if (request.CommissionIds.Count > 0)
            commissionQuery = commissionQuery.Where(c => request.CommissionIds.Contains(c.Id));

        var commissions = await commissionQuery.ToListAsync(cancellationToken);
        var now = DateTime.UtcNow;
        foreach (var commission in commissions)
        {
            commission.Status = "Paid";
            commission.PayoutId = payout.Id;
            commission.PaidAt = now;
            commission.LastModifiedAt = now;
            commission.LastModifiedBy = request.CreatedBy;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _ = _emailService.SendAsync(
            affiliate.Email,
            $"Affiliate Commission Payout — ₹{request.Amount:N2}",
            $"<div style='font-family:sans-serif;max-width:600px;margin:0 auto'>" +
            $"<h2 style='color:#4f46e5'>Commission Payout Processed</h2>" +
            $"<p>Hi {affiliate.Name}, a commission payout of <strong>₹{request.Amount:N2}</strong> has been processed to your account.</p>" +
            $"<p><strong>Method:</strong> {request.PaymentMethod}<br/>" +
            $"{(request.PaymentReference != null ? $"<strong>Reference:</strong> {request.PaymentReference}<br/>" : "")}" +
            $"{(request.Notes != null ? $"<strong>Notes:</strong> {request.Notes}" : "")}</p>" +
            $"<p>Log in to your affiliate portal to view your complete payout history.</p>" +
            $"<p style='color:#64748b;font-size:12px'>ChitStack — Chit Fund Management Software</p></div>");

        return Result<int>.Success(payout.Id);
    }
}
