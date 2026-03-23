using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ChitLedger.Domain.Entities;
using ChitLedger.Application.Features.Auctions.Commands.CloseAuction;

namespace ChitLedger.Application.Features.Auctions.Commands.RunLottery;

public class RunLotteryCommand : IRequest<Result<int>>
{
    public int AuctionId { get; set; }
}

public class RunLotteryHandler : IRequestHandler<RunLotteryCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuctionNotificationService _notificationService;
    private readonly IMediator _mediator;

    public RunLotteryHandler(IApplicationDbContext context, IAuctionNotificationService notificationService, IMediator mediator)
    {
        _context = context;
        _notificationService = notificationService;
        _mediator = mediator;
    }

    public async Task<Result<int>> Handle(RunLotteryCommand request, CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var auction = await _context.Auctions
                .Include(a => a.ChitGroup)
                .FirstOrDefaultAsync(a => a.Id == request.AuctionId, cancellationToken);

            if (auction == null) return Result<int>.Failure("Auction not found");
            if (auction.AuctionStatus == "Closed") return Result<int>.Failure("Auction is already closed");

            // Statutory Validations
            var settings = await _context.TenantSettings.FirstOrDefaultAsync(cancellationToken);
            decimal maxCapPercent = settings?.MaxBiddingDiscountPercent ?? 40;
            decimal maxBid = Math.Round(auction.ChitGroup.ChitValue * (maxCapPercent / 100), 0, MidpointRounding.AwayFromZero);

            if (auction.WinningBidAmount < maxBid)
                return Result<int>.Failure($"Cannot run lottery. Bid hasn't reached the maximum value of ₹{maxBid:N2}.");

            // Check if lottery already conducted on any bids
            var alreadyConducted = await _context.AuctionBids.AnyAsync(b => b.AuctionId == auction.Id && b.IsLotteryWinner, cancellationToken);
            if (alreadyConducted) return Result<int>.Failure("Lottery has already been conducted for this auction.");

            // Get all bidders who bid the maximum amount
            var tiedBids = await _context.AuctionBids
                .Include(b => b.Ticket)
                .ThenInclude(t => t.Member)
                .Where(b => b.AuctionId == auction.Id && Math.Abs(b.BidAmount - maxBid) < 1)
                .ToListAsync(cancellationToken);

            // Deduplicate by TicketId (a member may have bid several times, but the limit is their max participation)
            var tiedParticipants = tiedBids
                .GroupBy(b => b.TicketId)
                .Select(g => new { 
                    TicketId = g.Key, 
                    MemberName = g.First().Ticket.Member?.FullName ?? $"Ticket #{g.First().Ticket.TicketNumber}",
                    TicketNumber = g.First().Ticket.TicketNumber
                })
                .ToList();

            if (tiedParticipants.Count <= 1)
                 return Result<int>.Failure("No tie exists at the maximum bid level.");

            // Pick a random winner
            var random = new Random();
            var winner = tiedParticipants[random.Next(tiedParticipants.Count)];
            
            // Set winner
            auction.WinningTicketId = winner.TicketId;
            
            // Mark the latest bid for this member as the Lottery Winner for audit
            var winnerBid = tiedBids.Where(b => b.TicketId == winner.TicketId).OrderByDescending(b => b.BidTime).FirstOrDefault();
            if (winnerBid != null) winnerBid.IsLotteryWinner = true;

            await _context.SaveChangesAsync(cancellationToken);

            // Notify that lottery is STARTING
            // We broadcast all tied members and the winner to synchronise animation
            await _notificationService.NotifyLotteryStartedAsync(
                auction.Id, 
                tiedParticipants.Select(p => new { p.TicketId, p.MemberName, p.TicketNumber }), 
                winner.TicketId);

            // Automatically close the auction after lottery is done
            var closeResult = await _mediator.Send(new CloseAuctionCommand { AuctionId = auction.Id }, cancellationToken);
            if (!closeResult.Succeeded)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result<int>.Failure($"Lottery ran but auction closure failed: {string.Join(", ", closeResult.Errors)}");
            }

            await transaction.CommitAsync(cancellationToken);
            return Result<int>.Success(winner.TicketId);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result<int>.Failure($"Internal error during lottery: {ex.Message}");
        }
    }
}
