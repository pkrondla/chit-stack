using ChitStack.Domain.Common;

namespace ChitStack.Domain.Global;

public class TenantPaymentTransaction : BaseEntity
{
    public int OrderId { get; set; }
    public TenantOrder? Order { get; set; }

    public string TransactionReference { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // "UPI" | "NEFT" | "IMPS" | "Cheque" | "Other"
    public string? BankOrUpiDetails { get; set; }

    public string UpdatedBy { get; set; } = string.Empty;
    public string UpdatedByRole { get; set; } = string.Empty; // "User" | "Admin"

    public string Status { get; set; } = "Pending"; // "Pending" | "Confirmed" | "Rejected"
    public string? ConfirmedBy { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public string? RejectionReason { get; set; }
}
