using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Auctions.Commands.PlaceBid;

public class PlaceBidCommand : IRequest<Result<bool>>
{
    public int AuctionId { get; set; }
    public int BidderTicketId { get; set; } // Which ticket is bidding (Member)
    public decimal BidAmount { get; set; } // The DISCQOUNT amount usually in Chits
}

public class PlaceBidHandler : IRequestHandler<PlaceBidCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public PlaceBidHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(PlaceBidCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup)
            .FirstOrDefaultAsync(a => a.Id == request.AuctionId, cancellationToken);
            
        if (auction == null) return Result<bool>.Failure("Auction not found.");
        
        // TODO: Validate if auction is OPEN/LIVE
        
        var ticket = await _context.Tickets.FindAsync(new object[] { request.BidderTicketId }, cancellationToken);
        if (ticket == null) return Result<bool>.Failure("Ticket not found.");
        
        // Validation: Max Bid Cap (Chit Act 1982 usually caps at 30% or 40%)
        // Let's assume Max Bid = 30% of ChitValue
        var maxBid = auction.ChitGroup.ChitValue * 0.30m; 
        // Also Foreman Commission usually 5% is minimum bid implicitly? Or min bid = 5%.
        var minBid = auction.ChitGroup.ChitValue * (auction.ChitGroup.ForemanCommissionPercent / 100);

        if (request.BidAmount > maxBid)
            return Result<bool>.Failure($"Bid amount cannot exceed 30% ({maxBid}) of Chit Value.");
            
        if (request.BidAmount < minBid)
             return Result<bool>.Failure($"Bid must be at least the foreman commission ({minBid}).");

        if (request.BidAmount <= auction.WinningBidAmount)
            return Result<bool>.Failure("Bid must be higher than the current highest bid.");

        // Update Auction current high
        auction.WinningBidAmount = request.BidAmount;
        auction.WinningTicketId = request.BidderTicketId;
        
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
