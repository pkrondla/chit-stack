using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Groups.Commands.LaunchGroup;

public class LaunchGroupCommand : IRequest<Result<int>>
{
    public int GroupId { get; set; }
}

public class LaunchGroupHandler : IRequestHandler<LaunchGroupCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public LaunchGroupHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(LaunchGroupCommand request, CancellationToken cancellationToken)
    {
        var group = await _context.ChitGroups
            .Include(g => g.Tickets)
            .FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);

        if (group == null) return Result<int>.Failure("Group not found");

        if (group.Status != GroupStatus.Proposed)
            return Result<int>.Failure("Group is already launched or closed.");

        if (group.Tickets.Count < group.DurationMonths)
            return Result<int>.Failure($"Cannot launch. Only {group.Tickets.Count}/{group.DurationMonths} tickets subscribed.");

        // Update Status
        group.Status = GroupStatus.Active;
        group.LaunchDate = DateTime.UtcNow;

        // Schedule 1st Auction
        // Usually, 1st Auction is Installment 1, Date = Launch Date or Next Month
        // Act: 1st Installment is full payment to Foreman (No Auction), OR 1st Auction happens immediately?
        // Let's assume 1st Auction happens 1 month after Launch. Installment 1 is collection.
        // Actually, in many Chits, 1st installment is paid upfront, and 1st Auction is for 1st prize.
        
        var auction = new Auction
        {
            ChitGroupId = group.Id,
            InstallmentNumber = 1,
            AuctionDate = DateTime.UtcNow.AddMonths(1), // Scheduled for next month
            AuctionStatus = "Scheduled",
            WinningBidAmount = 0,
            DividendAmount = 0,
            NetPayableAmount = 0
        };
        _context.Auctions.Add(auction);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(group.Id);
    }
}
