using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Auctions.Commands.StartAuction;

public class StartAuctionCommand : IRequest<Result<bool>>
{
    public int AuctionId { get; set; }
    public int DurationMinutes { get; set; } = 5;
}

public class StartAuctionHandler : IRequestHandler<StartAuctionCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuctionNotificationService _notificationService;

    public StartAuctionHandler(IApplicationDbContext context, IAuctionNotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<Result<bool>> Handle(StartAuctionCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions.FindAsync(new object[] { request.AuctionId }, cancellationToken);
        if (auction == null) return Result<bool>.Failure("Auction not found.");

        if (auction.AuctionStatus == "Closed")
            return Result<bool>.Failure("Auction is already closed.");

        auction.AuctionStatus = "Live";
        await _context.SaveChangesAsync(cancellationToken);

        // Notify room that auction has started with timer
        await _notificationService.NotifyAuctionStartedAsync(request.AuctionId, request.DurationMinutes);

        return Result<bool>.Success(true);
    }
}
