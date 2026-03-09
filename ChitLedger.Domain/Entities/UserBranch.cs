using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class UserBranch : TenantEntity
{
    public int UserId { get; set; }
    public User? User { get; set; }

    public int BranchId { get; set; }
    public Branch? Branch { get; set; }

    public bool IsPrimary { get; set; } = false;
}
