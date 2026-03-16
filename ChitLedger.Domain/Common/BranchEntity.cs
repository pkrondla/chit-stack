namespace ChitLedger.Domain.Common;

public abstract class BranchEntity : TenantEntity
{
    public int? BranchId { get; set; }
}
