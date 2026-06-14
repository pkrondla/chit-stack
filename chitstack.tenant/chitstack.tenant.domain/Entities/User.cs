using ChitStack.Domain.Common;

namespace ChitStack.Domain.Entities;

public class User : TenantEntity
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "Staff"; // Manager, Clerk, Agent, Subscriber, Auditor
    
    // For Subscribers/Members
    public int? MemberId { get; set; }
    public Member? Member { get; set; }
    
    public int? AssignedRouteId { get; set; }
    public CollectionRoute? AssignedRoute { get; set; }

    // Persistent tracking
    public decimal? LastLatitude { get; set; }
    public decimal? LastLongitude { get; set; }
    public DateTime? LastLocationUpdateTime { get; set; }

    // Demo trial — set on demo stamp, null on dedicated stamps
    public DateTime? TrialEndDate { get; set; }

    public ICollection<UserBranch> UserBranches { get; set; } = new List<UserBranch>();
}
