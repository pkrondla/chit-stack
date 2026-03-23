using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Auctions.Queries.GetAuctionDemands;

public class AuctionDemandDto
{
    public int Id { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public int TicketNumber { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal DividendAmount { get; set; }
    public decimal NetAmount { get; set; }
    public decimal CollectedAmount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class GetAuctionDemandsQuery : IRequest<Result<List<AuctionDemandDto>>>
{
    public int AuctionId { get; set; }
}

public class GetAuctionDemandsHandler : IRequestHandler<GetAuctionDemandsQuery, Result<List<AuctionDemandDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAuctionDemandsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AuctionDemandDto>>> Handle(GetAuctionDemandsQuery request, CancellationToken cancellationToken)
    {
        var demands = await _context.Demands
            .Where(d => d.AuctionId == request.AuctionId)
            .OrderBy(d => d.Ticket.TicketNumber)
            .Select(d => new AuctionDemandDto
            {
                Id = d.Id,
                MemberName = d.Ticket.Member != null ? d.Ticket.Member.FullName : "Vacant",
                TicketNumber = d.Ticket.TicketNumber,
                GrossAmount = d.GrossAmount,
                DividendAmount = d.DividendAmount,
                NetAmount = d.NetAmount,
                CollectedAmount = d.CollectedAmount,
                Status = d.Status
            })
            .ToListAsync(cancellationToken);

        return Result<List<AuctionDemandDto>>.Success(demands);
    }
}
