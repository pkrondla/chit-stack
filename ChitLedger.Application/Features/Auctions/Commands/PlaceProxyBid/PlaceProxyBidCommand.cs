using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Auctions.Commands.PlaceProxyBid;

public class PlaceProxyBidCommand : IRequest<Result<int>>
{
    public int AuctionId { get; set; }
    public int TicketId { get; set; } // The member for whom bid is placed
    public decimal BidAmount { get; set; }
}

public class PlaceProxyBidHandler : IRequestHandler<PlaceProxyBidCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public PlaceProxyBidHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(PlaceProxyBidCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup)
            .FirstOrDefaultAsync(a => a.Id == request.AuctionId, cancellationToken);
            
        if (auction == null) return Result<int>.Failure("Auction not found");
        
        if (auction.AuctionStatus == "Closed") return Result<int>.Failure("Auction is closed");

        var ticket = await _context.Tickets.FindAsync(new object[] { request.TicketId }, cancellationToken);
        if (ticket == null || ticket.ChitGroupId != auction.ChitGroupId)
            return Result<int>.Failure("Invalid Ticket for this group");

        // Validate Bid Amount
        decimal maxBid = auction.ChitGroup.ChitValue * 0.30m; // Max 30%
        if (request.BidAmount > maxBid)
            return Result<int>.Failure($"Bid exceeds maximum limit ({maxBid:C})");

        // Update Auction (Simple "Winning" Logic for V1)
        auction.WinningTicketId = ticket.Id;
        auction.WinningBidAmount = request.BidAmount;
        
        // Calculate Dividend & Payable
        decimal commission = auction.ChitGroup.ChitValue * (auction.ChitGroup.ForemanCommissionPercent / 100);
        decimal dividendPool = request.BidAmount - commission;
        if (dividendPool < 0) dividendPool = 0; // Should not happen if bid > commission
        
        auction.DividendAmount = dividendPool / auction.ChitGroup.DurationMonths; // Per Member
        auction.NetPayableAmount = auction.ChitGroup.ChitValue - request.BidAmount;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(auction.Id);
    }
}
