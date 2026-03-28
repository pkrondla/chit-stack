using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class NotificationTemplate : TenantEntity
{
    public string Name { get; set; } = string.Empty; // e.g., "ReceiptConfirmation"
    public string TitleTemplate { get; set; } = string.Empty; // e.g., "Payment Received"
    public string MessageTemplate { get; set; } = string.Empty; // e.g., "Dear {MemberName}, we have received ₹{Amount}..."
    public bool IsEnabled { get; set; } = true;
    public string Placeholders { get; set; } = string.Empty; // Description of available tags: "{MemberName}, {Amount}, {Group}"
}
