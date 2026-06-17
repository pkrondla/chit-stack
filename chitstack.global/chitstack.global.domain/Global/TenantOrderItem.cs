using ChitStack.Domain.Common;

namespace ChitStack.Domain.Global;

public class TenantOrderItem : BaseEntity
{
    public int OrderId { get; set; }
    public TenantOrder? Order { get; set; }

    public int ComponentId { get; set; }
    public SoftwareComponent? Component { get; set; }

    public string ComponentName { get; set; } = string.Empty;
    public string ComponentCategory { get; set; } = string.Empty;

    /// <summary>"License" | "Annual" | "PerDay" | "AMC"</summary>
    public string PricingType { get; set; } = string.Empty;

    public decimal UnitPrice { get; set; }

    /// <summary>Number of days for PerDay items; 1 for everything else.</summary>
    public int Quantity { get; set; } = 1;

    public decimal LineTotal { get; set; }

    /// <summary>Set for Annual and AMC items (OrderDate + 1 year). Null for License/PerDay.</summary>
    public DateTime? ExpiryDate { get; set; }
}
