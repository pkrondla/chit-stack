using ChitStack.Domain.Common;

namespace ChitStack.Domain.Global;

public class TenantOrder : BaseEntity
{
    public string OrderReference { get; set; } = string.Empty;
    public int TenantId { get; set; }
    public GlobalTenant? Tenant { get; set; }

    public string CompanyName { get; set; } = string.Empty;
    public string TenantKey { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string? AdminPhone { get; set; }
    public string State { get; set; } = "Karnataka";

    public string BillingPeriod { get; set; } = string.Empty; // "Monthly" | "HalfYearly" | "Annual"

    public decimal RecurringTotal { get; set; }
    public decimal OneTimeTotal { get; set; }
    public decimal ServiceTotal { get; set; }
    public decimal TotalAmount { get; set; }

    public string OrderStatus { get; set; } = "Submitted";
    public string? Notes { get; set; }
    public string? ConnectionString { get; set; }

    public DateTime? ConfirmedAt { get; set; }
    public DateTime? ProvisionedAt { get; set; }

    public List<TenantOrderItem> Items { get; set; } = [];
    public List<TenantPaymentTransaction> PaymentTransactions { get; set; } = [];
}
