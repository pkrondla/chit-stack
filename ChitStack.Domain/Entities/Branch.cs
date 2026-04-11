using ChitStack.Domain.Common;

namespace ChitStack.Domain.Entities;

public class Branch : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? ContactNumber { get; set; }

    public ICollection<UserBranch> UserBranches { get; set; } = new List<UserBranch>();
}
