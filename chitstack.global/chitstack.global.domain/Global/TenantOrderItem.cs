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
    public string PricingType { get; set; } = string.Empty;

    public decimal UnitPrice { get; set; }
    public int? EstimatedHours { get; set; }
    public decimal LineTotal { get; set; }
}
