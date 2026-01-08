using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class Guarantor : TenantEntity
{
    public int TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string AadhaarNumber { get; set; } = string.Empty;
    public string Occupation { get; set; } = string.Empty;
    public decimal AnnualIncome { get; set; }
    public string Relationship { get; set; } = string.Empty; // e.g. Colleague, Relative
}
