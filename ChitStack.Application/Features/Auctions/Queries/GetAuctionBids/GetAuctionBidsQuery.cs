using AutoMapper;
using AutoMapper.QueryableExtensions;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ChitStack.Domain.Entities;

namespace ChitStack.Application.Features.Auctions.Queries.GetAuctionBids;

public class BidDto
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public int TicketNumber { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public decimal BidAmount { get; set; }
    public DateTime BidTime { get; set; }
    public string Source { get; set; } = string.Empty;
    public bool IsLotteryWinner { get; set; }
}

public class GetAuctionBidsQuery : IRequest<Result<List<BidDto>>>
{
    public int AuctionId { get; set; }
}

public class GetAuctionBidsHandler : IRequestHandler<GetAuctionBidsQuery, Result<List<BidDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetAuctionBidsHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<BidDto>>> Handle(GetAuctionBidsQuery request, CancellationToken cancellationToken)
    {
        var bids = await _context.AuctionBids
            .Where(b => b.AuctionId == request.AuctionId)
            .OrderByDescending(b => b.BidTime)
            .ProjectTo<BidDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return Result<List<BidDto>>.Success(bids);
    }
}

public class BidProfile : Profile
{
    public BidProfile()
    {
        CreateMap<ChitStack.Domain.Entities.AuctionBid, BidDto>()
            .ForMember(d => d.TicketNumber, opt => opt.MapFrom(s => s.Ticket.TicketNumber))
            .ForMember(d => d.MemberName, opt => opt.MapFrom(s => s.Ticket.Member != null ? s.Ticket.Member.FullName : "Unknown"))
            .ForMember(d => d.PhotoUrl, opt => opt.MapFrom(s => s.Ticket.Member != null ? s.Ticket.Member.PhotoUrl : null));
    }
}
