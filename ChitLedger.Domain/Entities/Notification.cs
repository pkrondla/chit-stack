using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public enum NotificationType
{
    Info,
    Success,
    Warning,
    Error
}

public class Notification : TenantEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Info;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
    
    public string? ActionUrl { get; set; } // e.g. /auctions/123
}
