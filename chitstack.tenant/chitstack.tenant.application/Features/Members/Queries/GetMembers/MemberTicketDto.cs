using ChitStack.Domain.Entities;

namespace ChitStack.Application.Features.Members.Queries.GetMembers;

public class MemberTicketDto
{
    public int Id { get; set; }
    public int TicketNumber { get; set; }
    public int ChitGroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public int TotalMonths { get; set; }
    public bool IsPrized { get; set; }
    public TicketStatus Status { get; set; }
}
