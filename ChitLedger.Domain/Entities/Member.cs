using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class Member : TenantEntity
{
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? PanNumber { get; set; }
    public string? PanDocumentUrl { get; set; }
    public string? AadhaarNumber { get; set; }
    public string? AadhaarDocumentUrl { get; set; }
    public string? PhotoUrl { get; set; }
    public bool KycVerified { get; set; } = false;

    public int? RegistrationBranchId { get; set; }
    public Branch? RegistrationBranch { get; set; }
    
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
