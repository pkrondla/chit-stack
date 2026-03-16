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
    public string Source { get; set; } = "Office"; // Office, Physical
}

public class PlaceProxyBidHandler : IRequestHandler<PlaceProxyBidCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuctionNotificationService _notificationService;

    public PlaceProxyBidHandler(IApplicationDbContext context, IAuctionNotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<Result<int>> Handle(PlaceProxyBidCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup)
            .FirstOrDefaultAsync(a => a.Id == request.AuctionId, cancellationToken);
            
        if (auction == null) return Result<int>.Failure("Auction not found");
        
        if (auction.AuctionStatus == "Closed") return Result<int>.Failure("Auction is closed");

        var ticket = await _context.Tickets
            .Include(t => t.Member)
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket == null || ticket.ChitGroupId != auction.ChitGroupId)
            return Result<int>.Failure("Invalid Ticket for this group");

        // Statutory Validations
        var settings = await _context.TenantSettings.FirstOrDefaultAsync(cancellationToken);
        decimal maxCapPercent = settings?.MaxBiddingDiscountPercent ?? 40;
        decimal maxBid = auction.ChitGroup.ChitValue * (maxCapPercent / 100);
        decimal minBid = auction.ChitGroup.ChitValue * (auction.ChitGroup.ForemanCommissionPercent / 100);

        if (request.BidAmount > maxBid)
            return Result<int>.Failure($"Bid exceeds maximum allowed discount of {maxCapPercent}% (₹{maxBid:N2})");

        if (request.BidAmount < minBid && auction.InstallmentNumber > 1)
            return Result<int>.Failure($"Bid must be at least the foreman commission of (₹{minBid:N2})");

        // Update Auction (Simple "Winning" Logic for V1)
        auction.WinningTicketId = ticket.Id;
        auction.WinningBidAmount = request.BidAmount;
        
        // Calculate Dividend & Payable
        decimal commission = auction.ChitGroup.ChitValue * (auction.ChitGroup.ForemanCommissionPercent / 100);
        decimal dividendPool = request.BidAmount - commission;
        if (dividendPool < 0) dividendPool = 0; // Should not happen if bid > commission
        
        auction.DividendAmount = dividendPool / auction.ChitGroup.DurationMonths; // Per Member
        auction.NetPayableAmount = auction.ChitGroup.ChitValue - request.BidAmount;

        // Record Bid History
        var bid = new AuctionBid
        {
            AuctionId = auction.Id,
            TicketId = request.TicketId,
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
            ticket.Member?.FullName ?? $"Ticket #{ticket.TicketNumber}",
            request.BidAmount,
            ticket.Member?.PhotoUrl,
            request.Source);

        return Result<int>.Success(auction.Id);
    }
}
