using AutoMapper;
using ChitLedger.Domain.Entities;

namespace ChitLedger.Application.Features.Members.Queries.GetMembers;

public class MemberDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Address { get; set; }
    public int? CollectionRouteId { get; set; }
    public string? CollectionRouteName { get; set; }
    public string? Email { get; set; }
    public string? PanNumber { get; set; }
    public string? PanDocumentUrl { get; set; }
    public string? AadhaarNumber { get; set; }
    public string? AadhaarDocumentUrl { get; set; }
    public string? PhotoUrl { get; set; }
    public string? RegistrationBranchName { get; set; }
    public int TicketCount { get; set; }
    public DateTime JoinedDate { get; set; }
    public List<MemberTicketDto> Tickets { get; set; } = new();
    public bool IsPortalEnabled { get; set; }

    private class Mapping : Profile
    {
        public Mapping()
        {
            CreateMap<Member, MemberDto>()
                .ForMember(d => d.TicketCount, opt => opt.MapFrom(s => s.Tickets.Count))
                .ForMember(d => d.JoinedDate, opt => opt.MapFrom(s => s.CreatedAt))
                .ForMember(d => d.RegistrationBranchName, opt => opt.MapFrom(s => s.RegistrationBranch != null ? s.RegistrationBranch.Name : null))
                .ForMember(d => d.CollectionRouteName, opt => opt.MapFrom(s => s.CollectionRoute != null ? s.CollectionRoute.RouteName : null))
                .ForMember(d => d.Tickets, opt => opt.MapFrom(s => s.Tickets))
                .ForMember(d => d.IsPortalEnabled, opt => opt.Ignore()); 

            CreateMap<Ticket, MemberTicketDto>()
                .ForMember(d => d.GroupName, opt => opt.MapFrom(s => s.ChitGroup.GroupName))
                .ForMember(d => d.ChitValue, opt => opt.MapFrom(s => s.ChitGroup.ChitValue))
                .ForMember(d => d.TotalMonths, opt => opt.MapFrom(s => s.ChitGroup.DurationMonths));
        }
    }
}
