using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ChitLedger.Domain.Entities;

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
        
        // Statutory Validations
        var settings = await _context.TenantSettings.FirstOrDefaultAsync(cancellationToken);
        decimal maxCapPercent = settings?.MaxBiddingDiscountPercent ?? 40;
        decimal maxBid = auction.ChitGroup.ChitValue * (maxCapPercent / 100);
        decimal minBid = auction.ChitGroup.ChitValue * (auction.ChitGroup.ForemanCommissionPercent / 100);

        if (request.BidAmount > maxBid)
            return Result<bool>.Failure($"Bid amount cannot exceed {maxCapPercent}% (₹{maxBid:N2}) of Chit Value.");
            
        if (request.BidAmount < minBid && auction.InstallmentNumber > 1)
             return Result<bool>.Failure($"Bid must be at least the foreman commission (₹{minBid:N2}).");

        if (request.BidAmount < auction.WinningBidAmount)
            return Result<bool>.Failure("Bid must be higher than the current highest bid.");

        if (request.BidAmount == auction.WinningBidAmount && request.BidAmount != maxBid)
            return Result<bool>.Failure("Bid must be higher than the current highest bid unless the maximum limit is reached.");

        // Prevent duplicate max bid from same member
        if (request.BidAmount == maxBid)
        {
            var alreadyAtMax = await _context.AuctionBids
                .AnyAsync(b => b.AuctionId == auction.Id && b.TicketId == request.BidderTicketId && b.BidAmount == maxBid, cancellationToken);
            if (alreadyAtMax)
                return Result<bool>.Failure("You have already entered the maximum bid.");
        }

        if (request.BidAmount > auction.WinningBidAmount)
        {
            auction.WinningBidAmount = request.BidAmount;
            auction.WinningTicketId = request.BidderTicketId;
        }
        
        // Record Bid History
        var bid = new AuctionBid
        {
            AuctionId = auction.Id,
            TicketId = request.BidderTicketId,
            BidAmount = request.BidAmount,
            BidTime = DateTime.UtcNow,
            Source = request.Source,
            BranchId = auction.BranchId,
            TenantId = auction.TenantId,
            IsActive = true
        };
        _context.AuctionBids.Add(bid);
        
        await _context.SaveChangesAsync(cancellationToken);

        // Notify Real-time
        await _notificationService.NotifyBidAsync(
            auction.Id, 
            ticket.Id,
            ticket.Member?.FullName ?? $"Ticket #{ticket.TicketNumber}", 
            request.BidAmount,
            ticket.Member?.PhotoUrl,
            request.Source);

        return Result<bool>.Success(true);
    }
}
