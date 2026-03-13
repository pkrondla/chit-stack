using AutoMapper;
using AutoMapper.QueryableExtensions;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Auctions.Queries.GetAuctions;

public class AuctionDto
{
    public int Id { get; set; }
    public int ChitGroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public int InstallmentNumber { get; set; }
    public DateTime AuctionDate { get; set; }
    public string AuctionStatus { get; set; } = string.Empty;
    public decimal WinningBidAmount { get; set; }
    public decimal ForemanCommissionAmount { get; set; }
    public decimal DividendAmount { get; set; }
    public decimal NetPayableAmount { get; set; }
    public int? WinningTicketId { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string? GroupStatus { get; set; }
    public decimal ChitValue { get; set; }
    public int DurationMonths { get; set; }
    public decimal ForemanCommissionPercent { get; set; }
}

public class GetAuctionsQuery : IRequest<Result<List<AuctionDto>>>
{
    public int? ChitGroupId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public class GetAuctionsHandler : IRequestHandler<GetAuctionsQuery, Result<List<AuctionDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetAuctionsHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<AuctionDto>>> Handle(GetAuctionsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Auctions
            .Include(x => x.ChitGroup)
            .AsNoTracking();

        if (request.ChitGroupId.HasValue)
        {
            query = query.Where(x => x.ChitGroupId == request.ChitGroupId);
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(x => x.AuctionDate >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(x => x.AuctionDate <= request.ToDate.Value);
        }

        var auctions = await query
            .OrderBy(x => x.AuctionDate)
            .ProjectTo<AuctionDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return Result<List<AuctionDto>>.Success(auctions);
    }
}

public class AuctionProfile : Profile
{
    public AuctionProfile()
    {
        CreateMap<Auction, AuctionDto>()
            .ForMember(d => d.GroupName, opt => opt.MapFrom(s => s.ChitGroup.GroupName))
            .ForMember(d => d.GroupStatus, opt => opt.MapFrom(s => s.ChitGroup.Status.ToString()))
            .ForMember(d => d.ChitValue, opt => opt.MapFrom(s => s.ChitGroup.ChitValue))
            .ForMember(d => d.DurationMonths, opt => opt.MapFrom(s => s.ChitGroup.DurationMonths))
            .ForMember(d => d.ForemanCommissionPercent, opt => opt.MapFrom(s => s.ChitGroup.ForemanCommissionPercent));
    }
}

