using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class Ticket : BranchEntity
{
    public int ChitGroupId { get; set; }
    public ChitGroup ChitGroup { get; set; } = null!;
    
    public int? MemberId { get; set; }
    public Member? Member { get; set; }
    
    public int TicketNumber { get; set; }
    public bool IsPrized { get; set; } = false; // Has verified prize money?
    public int? PrizedInstallment { get; set; }
    public TicketStatus Status { get; set; } = TicketStatus.Active;
    public bool IsForeman { get; set; } = false;
    public DateTime? RemovalDate { get; set; }
}

public enum TicketStatus
{
    Active,
    Removed,
    Vacant
}
