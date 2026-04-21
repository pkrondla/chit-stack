using ChitStack.Domain.Common;

namespace ChitStack.Domain.Entities;

public class NotificationTemplate : TenantEntity
{
    public string Name { get; set; } = string.Empty; // e.g., "ReceiptConfirmation"
    public string TitleTemplate { get; set; } = string.Empty; 
    
    public string MessageTemplate { get; set; } = string.Empty; // Default / In-Portal Message
    public string? WhatsAppTemplate { get; set; } // Formatting like *Bold*
    public string? SmsTemplate { get; set; }      // Shortened version (160 chars)
    public string? EmailHtmlTemplate { get; set; } // Full HTML content
    
    public bool IsEnabled { get; set; } = true;
    public string Placeholders { get; set; } = string.Empty; // Description of available tags: "{MemberName}, {Amount}, {Group}"
}
