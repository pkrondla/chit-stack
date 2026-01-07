using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Auctions.Commands.CloseAuction;

public class CloseAuctionCommand : IRequest<Result<int>>
{
    public int AuctionId { get; set; }
}

public class CloseAuctionHandler : IRequestHandler<CloseAuctionCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public CloseAuctionHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(CloseAuctionCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup)
            .ThenInclude(g => g.Tickets) // Need count for dividend
            .FirstOrDefaultAsync(a => a.Id == request.AuctionId, cancellationToken);
            
        if (auction == null) return Result<int>.Failure("Auction not found.");
        
        if (auction.WinningTicketId == null)
            return Result<int>.Failure("Cannot close auction without a winner.");

        // Calculate Dividend
        // Dividend = (WinningBid - ForemanCommission) / TotalTickets
        var commissionAmount = auction.ChitGroup.ChitValue * (auction.ChitGroup.ForemanCommissionPercent / 100);
        
        // Wait, WinningBidAmount IS the discount usually.
        // Net Payable to Winner = ChitValue - WinningBidAmount
        // Distributable Surplus = WinningBidAmount - ForemanCommission
        
        var distributableSurplus = auction.WinningBidAmount - commissionAmount;
        if (distributableSurplus < 0) distributableSurplus = 0; // Should not happen if min bid validated

        var totalTickets = auction.ChitGroup.Tickets.Count;
        if (totalTickets == 0) return Result<int>.Failure("No tickets in group to distribute dividend.");

        var dividendPerTicket = distributableSurplus / totalTickets;

        auction.ForemanCommissionAmount = commissionAmount;
        auction.DividendAmount = dividendPerTicket;
        auction.NetPayableAmount = auction.ChitGroup.ChitValue - auction.WinningBidAmount;
        auction.AuctionStatus = "Closed";

        // Mark Ticket as Prized
        var winningTicket = auction.ChitGroup.Tickets.First(t => t.Id == auction.WinningTicketId);
        winningTicket.IsPrized = true;
        winningTicket.PrizedInstallment = auction.InstallmentNumber;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(auction.Id);
    }
}
