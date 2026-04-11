using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Auctions.Commands.StartAuction;

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
        auction.SessionStartedAt = DateTime.UtcNow;
        auction.SessionDurationMinutes = request.DurationMinutes;
        
        await _context.SaveChangesAsync(cancellationToken);

        // Notify room that auction has started with timer
        await _notificationService.NotifyAuctionStartedAsync(request.AuctionId, request.DurationMinutes);

        return Result<bool>.Success(true);
    }
}
