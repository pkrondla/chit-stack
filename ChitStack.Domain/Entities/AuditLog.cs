using ChitStack.Domain.Common;

namespace ChitStack.Domain.Entities;

public class AuditLog : TenantEntity
{
    public string EntityName { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Action { get; set; } = string.Empty; // Insert, Update, Delete
    public string? DataBefore { get; set; } // JSON format
    public string? DataAfter { get; set; } // JSON format
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.Now;
}
