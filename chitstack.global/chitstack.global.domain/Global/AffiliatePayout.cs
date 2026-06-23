using ChitStack.Domain.Common;

namespace ChitStack.Domain.Global;

public class AffiliatePayout : BaseEntity
{
    public int AffiliateId { get; set; }
    public Affiliate? Affiliate { get; set; }

    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // UPI/Bank/Cash/Cheque
    public string? PaymentReference { get; set; }
    public string? Notes { get; set; }

    /// <summary>Completed / Reversed</summary>
    public string Status { get; set; } = "Completed";

    public List<AffiliateCommission> Commissions { get; set; } = [];
}
