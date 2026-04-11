using ChitStack.Domain.Common;

namespace ChitStack.Domain.Entities;

public class UserNotificationSetting : TenantEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    
    // Channel Toggles
    public bool InPortalEnabled { get; set; } = true;
    public bool WhatsAppEnabled { get; set; } = false;
    public bool SmsEnabled { get; set; } = false;
    public bool EmailEnabled { get; set; } = false;
    
    // Specific Alerts (Optional - for more granular control)
    public bool AuctionRemindersEnabled { get; set; } = true;
    public bool PaymentRemindersEnabled { get; set; } = true;
}
