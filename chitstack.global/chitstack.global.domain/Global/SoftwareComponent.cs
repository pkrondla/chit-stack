using ChitStack.Domain.Common;

namespace ChitStack.Domain.Global;

public class SoftwareComponent : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;    // "Core" | "AddOn" | "Service"
    public string PricingType { get; set; } = string.Empty; // "Monthly" | "License" | "Hourly"
    public bool IsMandatory { get; set; }

    // Used when PricingType = "Monthly"
    public decimal MonthlyPrice { get; set; }
    public decimal HalfYearlyPrice { get; set; }
    public decimal AnnualPrice { get; set; }

    // Used when PricingType = "License"
    public decimal LicensePrice { get; set; }

    // Used when PricingType = "Hourly"
    public decimal HourlyPrice { get; set; }

    public int DisplayOrder { get; set; }

    public decimal GetRecurringPrice(string billingPeriod) => billingPeriod switch
    {
        "HalfYearly" => HalfYearlyPrice,
        "Annual"     => AnnualPrice,
        _            => MonthlyPrice
    };
}
