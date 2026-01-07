using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class Ticket : TenantEntity
{
    public int ChitGroupId { get; set; }
    public ChitGroup ChitGroup { get; set; } = null!;
    
    public int MemberId { get; set; }
    public Member Member { get; set; } = null!;
    
    public int TicketNumber { get; set; }
    public bool IsPrized { get; set; } = false; // Has verified prize money?
    public int? PrizedInstallment { get; set; }
}
