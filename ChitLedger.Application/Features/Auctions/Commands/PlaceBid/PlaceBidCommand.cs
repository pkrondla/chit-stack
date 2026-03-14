using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Auctions.Commands.PlaceBid;

public class PlaceBidCommand : IRequest<Result<bool>>
{
    public int AuctionId { get; set; }
    public int BidderTicketId { get; set; } // Which ticket is bidding (Member)
    public decimal BidAmount { get; set; } // The DISCOUNT amount
    public string Source { get; set; } = "Web"; // Web, Mobile, Office
}

public class PlaceBidHandler : IRequestHandler<PlaceBidCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuctionNotificationService _notificationService;

    public PlaceBidHandler(IApplicationDbContext context, IAuctionNotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<Result<bool>> Handle(PlaceBidCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup)
            .FirstOrDefaultAsync(a => a.Id == request.AuctionId, cancellationToken);
            
        if (auction == null) return Result<bool>.Failure("Auction not found.");
        
        // TODO: Validate if auction is OPEN/LIVE
        
        var ticket = await _context.Tickets
            .Include(t => t.Member)
            .FirstOrDefaultAsync(t => t.Id == request.BidderTicketId, cancellationToken);
            
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

        // Notify Real-time
        await _notificationService.NotifyBidAsync(
            auction.Id, 
            ticket.Member?.FullName ?? $"Ticket #{ticket.TicketNumber}", 
            request.BidAmount,
            ticket.Member?.PhotoUrl,
            request.Source);

        return Result<bool>.Success(true);
    }
}
