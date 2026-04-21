using AutoMapper;
using ChitStack.Domain.Entities;

namespace ChitStack.Application.Features.ChitGroups.Queries.GetChitGroups;

public class ChitGroupDto
{
    public int Id { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public int DurationMonths { get; set; }
    public decimal InstallmentAmount { get; set; }
    public decimal ForemanCommissionPercent { get; set; }
    public decimal LateFeePercent { get; set; }
    public int GracePeriodDays { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? LaunchDate { get; set; }

    // Statutory / Regulatory fields
    public string? SanctionNumber { get; set; }
    public DateTime? SanctionDate { get; set; }
    public string? RegistrationNumber { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public string? AuctionVenueAddress { get; set; }
    public string? SecurityDepositBankName { get; set; }
    public string? SecurityDepositBankBranch { get; set; }
    public string? SecurityDepositFdrNumber { get; set; }
    public DateTime? SecurityDepositDate { get; set; }
    public decimal FilingFees { get; set; }
    // Auction schedule preference
    public string? AuctionScheduleMode { get; set; }
    public string? AuctionDayOfMonth { get; set; }
    public int? AuctionWeekNumber { get; set; }
    public int? AuctionDayOfWeek { get; set; }
    public string? AuctionTime { get; set; }

    private class Mapping : Profile
    {
        public Mapping()
        {
            CreateMap<ChitGroup, ChitGroupDto>()
                .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()));
        }
    }
}
