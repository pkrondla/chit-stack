using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Global;

public class GlobalUser : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
    public int TenantId { get; set; }
    public GlobalTenant? Tenant { get; set; }
}
