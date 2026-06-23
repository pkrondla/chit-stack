using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Global;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Orders.Commands.ConfirmPayment;

public class ConfirmPaymentCommand : IRequest<Result<bool>>
{
    public string OrderReference { get; set; } = string.Empty;
    public int? TransactionId { get; set; }
    public string ConfirmedBy { get; set; } = string.Empty;
    public bool IsRejection { get; set; } = false;
    public string? RejectionReason { get; set; }
}

public class ConfirmPaymentHandler : IRequestHandler<ConfirmPaymentCommand, Result<bool>>
{
    private readonly IGlobalDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IGlobalSettingsService _settings;

    public ConfirmPaymentHandler(IGlobalDbContext context, IEmailService emailService, IGlobalSettingsService settings)
    {
        _context = context;
        _emailService = emailService;
        _settings = settings;
    }

    public async Task<Result<bool>> Handle(
        ConfirmPaymentCommand request,
        CancellationToken cancellationToken)
    {
        var order = await _context.TenantOrders
            .Include(o => o.PaymentTransactions)
            .FirstOrDefaultAsync(o => o.OrderReference == request.OrderReference, cancellationToken);

        if (order is null)
            return Result<bool>.Failure("Order not found.");

        var now = DateTime.UtcNow;

        // Find the transaction to update
        var transaction = request.TransactionId.HasValue
            ? order.PaymentTransactions.FirstOrDefault(t => t.Id == request.TransactionId.Value)
            : order.PaymentTransactions.OrderByDescending(t => t.CreatedAt).FirstOrDefault();

        if (request.IsRejection)
        {
            if (transaction is not null)
            {
                transaction.Status = "Rejected";
                transaction.ConfirmedBy = request.ConfirmedBy;
                transaction.ConfirmedAt = now;
                transaction.RejectionReason = request.RejectionReason;
            }
            order.OrderStatus = "Submitted"; // Reset so user can re-submit

            _ = _emailService.SendAsync(
                order.AdminEmail,
                $"Payment Verification Failed — {order.OrderReference}",
                $"<p>We could not verify your payment for order <strong>{order.OrderReference}</strong>.</p>" +
                $"<p><strong>Reason:</strong> {request.RejectionReason}</p>" +
                $"<p>Please re-submit your payment details or contact support.</p>");
        }
        else
        {
            if (transaction is not null)
            {
                transaction.Status = "Confirmed";
                transaction.ConfirmedBy = request.ConfirmedBy;
                transaction.ConfirmedAt = now;
            }
            order.OrderStatus = "PaymentConfirmed";
            order.ConfirmedAt = now;

            // Auto-create affiliate commission if order is linked to an affiliate
            if (order.AffiliateId.HasValue)
            {
                var alreadyExists = await _context.AffiliateCommissions
                    .AnyAsync(c => c.TenantOrderId == order.Id, cancellationToken);

                if (!alreadyExists)
                {
                    var affiliate = await _context.Affiliates
                        .AsNoTracking()
                        .FirstOrDefaultAsync(a => a.Id == order.AffiliateId.Value, cancellationToken);

                    if (affiliate is not null)
                    {
                        var defaultPctStr = await _settings.GetAsync(
                            SettingKeys.Affiliate.Group, SettingKeys.Affiliate.DefaultCommissionPercent, cancellationToken);
                        var defaultPct = decimal.TryParse(defaultPctStr, out var parsed) ? parsed : 5m;
                        var pct = affiliate.CommissionPercent ?? defaultPct;

                        _context.AffiliateCommissions.Add(new AffiliateCommission
                        {
                            AffiliateId = affiliate.Id,
                            TenantOrderId = order.Id,
                            OrderAmount = order.TotalAmount,
                            CommissionPercent = pct,
                            CommissionAmount = Math.Round(order.TotalAmount * pct / 100, 2),
                            Status = "Pending",
                            CreatedBy = request.ConfirmedBy
                        });
                    }
                }
            }

            _ = _emailService.SendAsync(
                order.AdminEmail,
                $"Payment Confirmed — {order.OrderReference}",
                $"<p>Your payment for order <strong>{order.OrderReference}</strong> has been confirmed!</p>" +
                $"<p>We are now preparing your dedicated ChitStack portal. " +
                $"You will receive an email with your login details once it is ready.</p>");
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
