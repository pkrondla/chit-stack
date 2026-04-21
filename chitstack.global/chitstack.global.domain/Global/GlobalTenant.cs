using ChitStack.Domain.Common;

namespace ChitStack.Domain.Global;

public class GlobalTenant : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string ConnectionString { get; set; } = string.Empty; // Encrypted or template
    public string State { get; set; } = "Karnataka"; // For compliance rules
}
