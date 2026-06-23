using ChitStack.Domain.Common;

namespace ChitStack.Domain.Global;

public class AffiliateCommission : BaseEntity
{
    public int AffiliateId { get; set; }
    public Affiliate? Affiliate { get; set; }

    public int TenantOrderId { get; set; }
    public TenantOrder? TenantOrder { get; set; }

    public decimal OrderAmount { get; set; }
    public decimal CommissionPercent { get; set; }
    public decimal CommissionAmount { get; set; }

    /// <summary>Pending / Paid</summary>
    public string Status { get; set; } = "Pending";

    public int? PayoutId { get; set; }
    public AffiliatePayout? Payout { get; set; }

    public DateTime? PaidAt { get; set; }
}
