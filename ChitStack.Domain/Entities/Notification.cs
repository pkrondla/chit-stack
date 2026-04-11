using ChitStack.Domain.Common;

namespace ChitStack.Domain.Entities;

public enum NotificationType
{
    Info,
    Success,
    Warning,
    Error
}

public class Notification : TenantEntity
{
    public int? UserId { get; set; }
    public User? User { get; set; }
    
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Info;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
    
    public string? ActionUrl { get; set; } // e.g. /auctions/123
    
    // Logging Enrichment
    public string? TemplateName { get; set; }
    public string? ChannelsSent { get; set; } // e.g. "In-Portal, WhatsApp, SMS"
    public int? MemberId { get; set; }
}
