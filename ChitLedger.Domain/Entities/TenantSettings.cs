using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

/// <summary>
/// Holds the company/branch profile data used in statutory documents filed with the Registrar of Chits.
/// There is expected to be ONE record per tenant branch, upserted from the Settings page.
/// </summary>
public class TenantSettings : TenantEntity
{
    // Company Identity
    public string CompanyName { get; set; } = string.Empty;         // Legal name as registered
    public string RegistrationNumber { get; set; } = string.Empty;  // ROC Regd. No.
    public string RegisteredOfficeAddress { get; set; } = string.Empty;

    // Authorised Signatory / Foreman
    public string ForemanName { get; set; } = string.Empty;
    public string ForemanDesignation { get; set; } = "Authorized Signatory";

    // Contact
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    
    // Digital Payments
    public string? CompanyUpiId { get; set; } // e.g. chit.ledger@okaxis
    public string? CompanyUpiName { get; set; } // Display Name for QR

    // Filing details (used in all statutory forms)
    public decimal StatutoryFilingFees { get; set; } = 0; // Standard fee paid to Registrar

    // Registrar-assigned GSTIN / PAN (optional, shown on receipts)
    public string? GstNumber { get; set; }
    public string? PanNumber { get; set; }

    // Auction Rules
    public decimal MaxBiddingDiscountPercent { get; set; } = 40; // Default 40% as per Tamil Nadu Chit Fund Act
    public decimal TdsPercent { get; set; } = 0; // TDS on Dividend/Prize
    public decimal GstPercent { get; set; } = 18; // GST on Commission

    // Penalty Rules
    public decimal DefaultLateFeePercent { get; set; } = 2; // Flat 2% penalty by default
    public int DefaultGracePeriodDays { get; set; } = 5;

    // Email Configuration
    public string? SmtpHost { get; set; }
    public int? SmtpPort { get; set; }
    public string? SmtpUser { get; set; }
    public string? SmtpPass { get; set; } // Should be encrypted in production
    public string? EmailFrom { get; set; }

    // WhatsApp Configuration (e.g. Gupshup/Meta)
    public string? WhatsAppApiUrl { get; set; }
    public string? WhatsAppApiKey { get; set; }
    public string? WhatsAppSenderNumber { get; set; }

    // SMS Configuration
    public string? SmsApiUrl { get; set; }
    public string? SmsApiKey { get; set; }
    public string? SmsSenderId { get; set; }

    // Automation Rules
    public bool AutoPaymentRemindersEnabled { get; set; } = false;
    public int PaymentReminderDaysBefore { get; set; } = 3;
    public bool AutoAuctionRemindersEnabled { get; set; } = false;
    public int AuctionReminderHoursBefore { get; set; } = 24;

    // Transactional Alert Toggles
    public bool NotifyOnReceipt { get; set; } = true;
    public bool NotifyOnAuctionWon { get; set; } = true;
    public bool NotifyOnDividend { get; set; } = false;
    public bool NotifyOnDemand { get; set; } = true;
    public bool NotifyOnReconciliation { get; set; } = true;
    public bool NotifyOnPayout { get; set; } = true;
}
