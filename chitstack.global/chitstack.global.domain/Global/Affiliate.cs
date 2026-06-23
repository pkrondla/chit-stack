using ChitStack.Domain.Common;

namespace ChitStack.Domain.Global;

public class Affiliate : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string PasswordHash { get; set; } = string.Empty;

    public bool IsApproved { get; set; } = false;

    /// <summary>Per-affiliate override. Null means use GlobalSettings DefaultCommissionPercent.</summary>
    public decimal? CommissionPercent { get; set; }

    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }

    public List<AffiliateCommission> Commissions { get; set; } = [];
    public List<AffiliatePayout> Payouts { get; set; } = [];
}
