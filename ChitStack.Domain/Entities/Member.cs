using ChitStack.Domain.Common;

namespace ChitStack.Domain.Entities;

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
    
    // Geographical mapping for routes
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }

    public int? RegistrationBranchId { get; set; }
    public Branch? RegistrationBranch { get; set; }
    
    public int? CollectionRouteId { get; set; }
    public CollectionRoute? CollectionRoute { get; set; }
    
    // Communication Preferences
    public bool InPortalEnabled { get; set; } = true;
    public bool WhatsAppEnabled { get; set; } = true;
    public bool SmsEnabled { get; set; } = true;
    public bool EmailEnabled { get; set; } = true;
    
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
