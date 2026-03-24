using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class CollectionRoute : BranchEntity
{
    public string RouteName { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    // Navigation
    public ICollection<Member> Members { get; set; } = new List<Member>();
    public ICollection<User> Agents { get; set; } = new List<User>();
    public Branch? Branch { get; set; }
}
