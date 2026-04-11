using ChitStack.Domain.Common;

namespace ChitStack.Domain.Entities;

public class Tenant : BaseEntity
{
    public string TenantKey { get; set; } = string.Empty; // Key (e.g., "demo", "pkrondla")
    public string Name { get; set; } = string.Empty;
    public string SubscriptionStatus { get; set; } = "Active";
}
