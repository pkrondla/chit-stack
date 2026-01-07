using AutoMapper;
using ChitLedger.Domain.Entities;

namespace ChitLedger.Application.Features.ChitGroups.Queries.GetChitGroups;

public class ChitGroupDto
{
    public int Id { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public int DurationMonths { get; set; }
    public decimal InstallmentAmount { get; set; }
    public string Status { get; set; } = string.Empty;

    private class Mapping : Profile
    {
        public Mapping()
        {
            CreateMap<ChitGroup, ChitGroupDto>()
                .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()));
        }
    }
}
