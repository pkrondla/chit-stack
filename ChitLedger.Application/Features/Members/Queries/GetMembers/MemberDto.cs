using AutoMapper;
using ChitLedger.Domain.Entities;

namespace ChitLedger.Application.Features.Members.Queries.GetMembers;

public class MemberDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? PanNumber { get; set; }
    public string? AadhaarNumber { get; set; }
    public int TicketCount { get; set; }

    private class Mapping : Profile
    {
        public Mapping()
        {
            CreateMap<Member, MemberDto>()
                .ForMember(d => d.TicketCount, opt => opt.MapFrom(s => s.Tickets.Count));
        }
    }
}
