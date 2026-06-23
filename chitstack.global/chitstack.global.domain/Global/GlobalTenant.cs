using ChitStack.Domain.Common;

namespace ChitStack.Domain.Global;

public class GlobalTenant : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string ConnectionString { get; set; } = string.Empty;
    public string State { get; set; } = "Karnataka";

    // Registration & trial fields
    public string SubscriptionStatus { get; set; } = "DemoAccess";
    public DateTime TrialStartDate { get; set; } = DateTime.UtcNow;
    public DateTime TrialEndDate { get; set; } = DateTime.UtcNow.AddDays(30);
    public string ContactEmail { get; set; } = string.Empty;
    public string? ContactPhone { get; set; }
    public DateTime? ProvisionedAt { get; set; }

    public int? AffiliateId { get; set; }
    public Affiliate? Affiliate { get; set; }

    public bool IsTrialExpired =>
        SubscriptionStatus == "DemoAccess" && TrialEndDate < DateTime.UtcNow;
}
