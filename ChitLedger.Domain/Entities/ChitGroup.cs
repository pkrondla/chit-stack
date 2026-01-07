using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class ChitGroup : TenantEntity
{
    public string GroupName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public int DurationMonths { get; set; }
    public decimal InstallmentAmount { get; set; }
    public decimal ForemanCommissionPercent { get; set; } = 5.0m;
    public DateTime? LaunchDate { get; set; }
    public GroupStatus Status { get; set; } = GroupStatus.Proposed;
    
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    public ICollection<Auction> Auctions { get; set; } = new List<Auction>();
}

public enum GroupStatus
{
    Proposed,
    Active,
    Completed,
    Closed
}
