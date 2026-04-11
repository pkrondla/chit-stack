using ChitStack.Domain.Common;

namespace ChitStack.Domain.Entities;

public class Nominee : TenantEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty; // e.g. Spouse, Son, Father
    public DateTime DateOfBirth { get; set; }
    public string? AadhaarNumber { get; set; }
    public string? PhoneNumber { get; set; }
    
    // If Nominee is minor
    public string? GuardianName { get; set; }
    public string? GuardianRelationship { get; set; }

    // Relationship with Ticket
    public int TicketId { get; set; }
    public Ticket? Ticket { get; set; }
}
