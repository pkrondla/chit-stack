using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Auctions.Commands.RevertAuction;

public class RevertAuctionCommand : IRequest<Result<int>>
{
    public int AuctionId { get; set; }
}

public class RevertAuctionHandler : IRequestHandler<RevertAuctionCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IStaffNotificationService _staffNotification;

    public RevertAuctionHandler(IApplicationDbContext context, IStaffNotificationService staffNotification)
    {
        _context = context;
        _staffNotification = staffNotification;
    }

    public async Task<Result<int>> Handle(RevertAuctionCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup)
            .ThenInclude(g => g.Tickets)
            .FirstOrDefaultAsync(a => a.Id == request.AuctionId, cancellationToken);
            
        if (auction == null) return Result<int>.Failure("Auction not found.");
        
        if (auction.AuctionStatus != "Closed") 
            return Result<int>.Failure("Only completed auctions can be reverted.");

        // 1. Unmark ANY tickets in this group that were prized in THIS installment
        var ticketsInGroup = await _context.Tickets
            .Where(t => t.ChitGroupId == auction.ChitGroupId && t.PrizedInstallment == auction.InstallmentNumber)
            .ToListAsync(cancellationToken);

        foreach (var ticket in ticketsInGroup)
        {
            ticket.IsPrized = false;
            ticket.PrizedInstallment = null;
        }

        // 2. Delete Journal Entries
        var journalEntries = await _context.JournalEntries
            .Where(j => j.ReferenceId == auction.Id && j.ReferenceType == "Auction")
            .ToListAsync(cancellationToken);
            
        foreach(var entry in journalEntries)
        {
            var lines = await _context.JournalEntryLines.Where(l => l.JournalEntryId == entry.Id).ToListAsync(cancellationToken);
            _context.JournalEntryLines.RemoveRange(lines);
            _context.JournalEntries.Remove(entry);
        }

        // 2.1 Delete Bidding History
        var bids = await _context.AuctionBids.Where(b => b.AuctionId == auction.Id).ToListAsync(cancellationToken);
        _context.AuctionBids.RemoveRange(bids);

        // 2.2 Delete Demands safely
        var demands = await _context.Demands.Where(d => d.AuctionId == auction.Id).ToListAsync(cancellationToken);
        if (demands.Any(d => d.CollectedAmount > 0))
        {
            return Result<int>.Failure("Cannot revert auction because payments have already been collected against its demands. Reverse the payments first.");
        }
        _context.Demands.RemoveRange(demands);

        // 2.2 Delete Attendance
        var attendance = await _context.AuctionAttendances.Where(a => a.AuctionId == auction.Id).ToListAsync(cancellationToken);
        _context.AuctionAttendances.RemoveRange(attendance);

        // 3. Clear Auction results
        auction.WinningTicketId = null;
        auction.WinningBidAmount = 0;
        auction.ForemanCommissionAmount = 0;
        auction.DividendAmount = 0;
        auction.TdsAmount = 0;
        auction.NetPayableAmount = 0;
        auction.AuctionStatus = "Scheduled"; // Set back to scheduled/ready for restart
        auction.IsPaid = false;
        auction.PaymentDate = null;
        auction.PaymentMode = null;
        auction.PaymentReference = null;

        // 4. Delete future installments (if they were created automatically)
        var nextAuctions = await _context.Auctions
            .Where(a => a.ChitGroupId == auction.ChitGroupId && a.InstallmentNumber > auction.InstallmentNumber)
            .ToListAsync(cancellationToken);
            
        _context.Auctions.RemoveRange(nextAuctions);

        // 5. Restore group status if it was completed
        if (auction.ChitGroup.Status == Domain.Entities.GroupStatus.Completed)
        {
            auction.ChitGroup.Status = Domain.Entities.GroupStatus.Active;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _staffNotification.Broadcast(
            "Auction Reverted",
            $"Auction #{request.AuctionId} (installment #{auction.InstallmentNumber} of '{auction.ChitGroup.GroupName}') has been reverted to Scheduled.",
            ChitStack.Domain.Entities.NotificationType.Warning);

        return Result<int>.Success(auction.Id);
    }
}
