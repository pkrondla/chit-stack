using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

/// <summary>
/// A public/bank holiday on which auctions should not be scheduled.
/// Tenant-wide. Can be recurring yearly (e.g. Diwali, Pongal) or one-off.
/// </summary>
public class HolidayDate : TenantEntity
{
    public DateOnly Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsRecurringYearly { get; set; } = false;
}
