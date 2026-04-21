using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Auctions.Commands.UpdateAuctionCompletion;

public class UpdateAuctionCompletionCommand : IRequest<Result<int>>
{
    public int AuctionId { get; set; }
    public int WinningTicketId { get; set; }
    public decimal WinningBidAmount { get; set; }
}

public class UpdateAuctionCompletionHandler : IRequestHandler<UpdateAuctionCompletionCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IGSTService _gstService;

    public UpdateAuctionCompletionHandler(IApplicationDbContext context, IGSTService gstService)
    {
        _context = context;
        _gstService = gstService;
    }

    public async Task<Result<int>> Handle(UpdateAuctionCompletionCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup)
            .ThenInclude(g => g.Tickets)
            .Include(a => a.WinningTicket)
            .FirstOrDefaultAsync(a => a.Id == request.AuctionId, cancellationToken);

        if (auction == null) return Result<int>.Failure("Auction not found.");

        // Statutoty Validations
        var settings = await _context.TenantSettings.FirstOrDefaultAsync(cancellationToken);
        decimal maxCapPercent = settings?.MaxBiddingDiscountPercent ?? 40;
        decimal maxBiddingAmount = auction.ChitGroup.ChitValue * (maxCapPercent / 100);
        decimal minBiddingAmount = auction.ChitGroup.ChitValue * (auction.ChitGroup.ForemanCommissionPercent / 100);

        if (request.WinningBidAmount > maxBiddingAmount)
            return Result<int>.Failure($"Winning bid (₹{request.WinningBidAmount:N2}) exceeds the maximum allowed discount of {maxCapPercent}% (₹{maxBiddingAmount:N2}).");

        if (request.WinningBidAmount < minBiddingAmount && auction.InstallmentNumber > 1)
            return Result<int>.Failure($"Winning bid (₹{request.WinningBidAmount:N2}) is below the minimum foreman commission of {auction.ChitGroup.ForemanCommissionPercent}% (₹{minBiddingAmount:N2}).");
        
        // Unmark previous winner if it changed
        if (auction.WinningTicketId.HasValue && auction.WinningTicketId != request.WinningTicketId)
        {
            var prevWinner = auction.ChitGroup.Tickets.FirstOrDefault(t => t.Id == auction.WinningTicketId);
            if (prevWinner != null)
            {
                prevWinner.IsPrized = false;
                prevWinner.PrizedInstallment = null;
            }
        }

        // Update Winner and Bid
        auction.WinningTicketId = request.WinningTicketId;
        auction.WinningBidAmount = request.WinningBidAmount;
        auction.AuctionStatus = "Closed";

        // Recalculate Dividend
        var commissionBase = auction.ChitGroup.ChitValue * (auction.ChitGroup.ForemanCommissionPercent / 100);
        var distributableSurplus = auction.WinningBidAmount - commissionBase;
        if (distributableSurplus < 0) distributableSurplus = 0;

        var totalTickets = auction.ChitGroup.Tickets.Count;
        var dividendPerTicket = distributableSurplus / totalTickets;

        auction.ForemanCommissionAmount = commissionBase;
        auction.DividendAmount = dividendPerTicket;
        auction.NetPayableAmount = auction.ChitGroup.ChitValue - auction.WinningBidAmount;

        // Mark New Ticket as Prized
        var winningTicket = auction.ChitGroup.Tickets.First(t => t.Id == auction.WinningTicketId);
        winningTicket.IsPrized = true;
        winningTicket.PrizedInstallment = auction.InstallmentNumber;

        // Recalculate demands if they exist
        var demands = await _context.Demands.Where(d => d.AuctionId == auction.Id).ToListAsync(cancellationToken);
        
        bool canUpdateDemands = !demands.Any(d => d.CollectedAmount > 0);
        if (!canUpdateDemands && dividendPerTicket != demands.FirstOrDefault()?.DividendAmount)
        {
            return Result<int>.Failure("Cannot change auction results because some members have already paid their dues based on the previous calculations. Reverse those payments first.");
        }

        foreach(var demand in demands)
        {
            demand.DividendAmount = dividendPerTicket;
            demand.NetAmount = demand.GrossAmount - demand.DividendAmount;
        }

        // Note: In a real system, we'd also reverse/recreate Journal Entries. 
        // For now, we update the Auction entity which the UI consumes.

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(auction.Id);
    }
}
