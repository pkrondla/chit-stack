using ChitStack.Domain.Common;

namespace ChitStack.Domain.Global;

public class SoftwareComponent : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;    // "Core" | "AddOn"

    /// <summary>
    /// "License" — one-time purchase (Core software, add-ons like WhatsApp/SMS/Apps)<br/>
    /// "Annual"  — recurring every year (Cloud Infrastructure)<br/>
    /// "PerDay"  — per training day; quantity entered by subscriber
    /// </summary>
    public string PricingType { get; set; } = string.Empty;

    public bool IsMandatory { get; set; }

    /// <summary>One-time cost. Populated when PricingType = "License".</summary>
    public decimal LicensePrice { get; set; }

    /// <summary>Cost per year. Populated when PricingType = "Annual".</summary>
    public decimal AnnualPrice { get; set; }

    /// <summary>Cost per training day. Populated when PricingType = "PerDay".</summary>
    public decimal DailyPrice
    {
        get => HourlyPrice;   // stored in HourlyPrice column (no schema change needed)
        set => HourlyPrice = value;
    }

    // Kept for EF Core column mapping — use DailyPrice in code for PerDay items
    public decimal HourlyPrice { get; set; }

    // Retained columns — no longer used for pricing but kept to avoid DB drift
    public decimal MonthlyPrice { get; set; }
    public decimal HalfYearlyPrice { get; set; }

    public int DisplayOrder { get; set; }
}
