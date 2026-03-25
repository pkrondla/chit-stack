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
}
