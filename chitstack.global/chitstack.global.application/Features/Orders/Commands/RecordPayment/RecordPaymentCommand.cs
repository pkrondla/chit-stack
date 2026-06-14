using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Global;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Orders.Commands.RecordPayment;

public class RecordPaymentCommand : IRequest<Result<bool>>
{
    public string OrderReference { get; set; } = string.Empty;
    public string TransactionReference { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? BankOrUpiDetails { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
    public string UpdatedByRole { get; set; } = "User"; // "User" | "Admin"
}

public class RecordPaymentHandler : IRequestHandler<RecordPaymentCommand, Result<bool>>
{
    private readonly IGlobalDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IGlobalSettingsService _settings;

    public RecordPaymentHandler(
        IGlobalDbContext context,
        IEmailService emailService,
        IGlobalSettingsService settings)
    {
        _context = context;
        _emailService = emailService;
        _settings = settings;
    }

    public async Task<Result<bool>> Handle(
        RecordPaymentCommand request,
        CancellationToken cancellationToken)
    {
        var order = await _context.TenantOrders
            .FirstOrDefaultAsync(o => o.OrderReference == request.OrderReference, cancellationToken);

        if (order is null)
            return Result<bool>.Failure("Order not found.");

        var transaction = new TenantPaymentTransaction
        {
            OrderId              = order.Id,
            TransactionReference = request.TransactionReference,
            PaymentDate          = request.PaymentDate,
            Amount               = request.Amount,
            PaymentMethod        = request.PaymentMethod,
            BankOrUpiDetails     = request.BankOrUpiDetails,
            UpdatedBy            = request.UpdatedBy,
            UpdatedByRole        = request.UpdatedByRole,
            Status               = "Pending",
            CreatedBy            = request.UpdatedBy
        };

        order.OrderStatus = "PaymentPending";
        _context.TenantPaymentTransactions.Add(transaction);
        await _context.SaveChangesAsync(cancellationToken);

        // Notify admin when the customer submits payment details
        if (request.UpdatedByRole == "User")
        {
            var adminEmail = await _settings.GetAsync(SettingKeys.Platform.Group, SettingKeys.Platform.AdminEmail, cancellationToken);
            if (!string.IsNullOrWhiteSpace(adminEmail))
            {
                _ = _emailService.SendAsync(
                    adminEmail,
                    $"Payment Details Submitted — {request.OrderReference}",
                    $"<p>The tenant has submitted payment details for order <strong>{request.OrderReference}</strong>.</p>" +
                    $"<p>Transaction Ref: {request.TransactionReference}<br/>" +
                    $"Amount: ₹{request.Amount:N2}<br/>Method: {request.PaymentMethod}</p>" +
                    $"<p>Please verify and confirm in the admin portal.</p>");
            }
        }

        return Result<bool>.Success(true);
    }
}
