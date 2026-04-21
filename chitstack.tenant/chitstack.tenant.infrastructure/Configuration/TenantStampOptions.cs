namespace ChitStack.Infrastructure.Tenant.Configuration;

public class TenantStampOptions
{
    public const string SectionName = "TenantStamp";

    public bool EnableFixedTenant { get; set; }

    public int FixedTenantId { get; set; } = 1;

    public string? FixedTenantConnectionString { get; set; }
}
