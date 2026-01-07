using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class User : TenantEntity
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "Staff"; // Manager, Clerk, Agent, Subscriber
    
    // For Subscribers/Members
    public int? MemberId { get; set; }
    public Member? Member { get; set; }
}
