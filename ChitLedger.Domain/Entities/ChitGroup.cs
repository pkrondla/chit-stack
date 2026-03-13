using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class ChitGroup : BranchEntity
{
    public string GroupName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public int DurationMonths { get; set; }
    public decimal InstallmentAmount { get; set; }
    public decimal ForemanCommissionPercent { get; set; } = 5.0m;
    public DateTime? LaunchDate { get; set; }
    public GroupStatus Status { get; set; } = GroupStatus.Proposed;
    
    // Late Fee Config
    public decimal LateFeePercent { get; set; } = 2.0m; // Monthly
    public int GracePeriodDays { get; set; } = 5; // Days before penalty kicks in

    // Statutory / Regulatory Fields
    public string? SanctionNumber { get; set; }           // Allotted by Registrar after Form I approval
    public DateTime? SanctionDate { get; set; }           // Date sanction was issued by Registrar
    public string? RegistrationNumber { get; set; }       // Chit Registration No. issued after Form II is filed
    public DateTime? RegistrationDate { get; set; }       // Date of chit registration
    public string? AuctionVenueAddress { get; set; }      // Address where monthly auctions are held
    public string? SecurityDepositBankName { get; set; }  // Bank where security deposit held
    public string? SecurityDepositBankBranch { get; set; }
    public string? SecurityDepositFdrNumber { get; set; } // Fixed Deposit Receipt number
    public DateTime? SecurityDepositDate { get; set; }    // Date FDR was created
    public decimal FilingFees { get; set; } = 0;          // Fees paid to Registrar for this group

    // Auction Schedule Preference (set before/at launch)
    public string? AuctionScheduleMode { get; set; }  // 'FixedDay' | 'SameWeekday'
    public int? AuctionDayOfMonth { get; set; }        // e.g. 15 (used when mode = FixedDay)
    public int? AuctionWeekNumber { get; set; }        // e.g. 3 (3rd weekday, used when mode = SameWeekday)
    public int? AuctionDayOfWeek { get; set; }         // 0=Sun..6=Sat (used when mode = SameWeekday)
    public TimeOnly? AuctionTime { get; set; }         // e.g. 16:00
    
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
