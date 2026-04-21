using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Auctions.Commands.ScheduleAuction;

public class ScheduleAuctionCommand : IRequest<Result<int>>
{
    public int ChitGroupId { get; set; }
    public int InstallmentNumber { get; set; }
    public DateTime AuctionDate { get; set; }
}

public class ScheduleAuctionValidator : AbstractValidator<ScheduleAuctionCommand>
{
    public ScheduleAuctionValidator()
    {
        RuleFor(v => v.ChitGroupId).GreaterThan(0);
        RuleFor(v => v.InstallmentNumber).GreaterThan(0);
        RuleFor(v => v.AuctionDate).GreaterThan(DateTime.Now).WithMessage("Auction date must be in the future.");
    }
}

public class ScheduleAuctionHandler : IRequestHandler<ScheduleAuctionCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IStaffNotificationService _staffNotification;

    public ScheduleAuctionHandler(IApplicationDbContext context, IStaffNotificationService staffNotification)
    {
        _context = context;
        _staffNotification = staffNotification;
    }

    public async Task<Result<int>> Handle(ScheduleAuctionCommand request, CancellationToken cancellationToken)
    {
        var group = await _context.ChitGroups.FindAsync(new object[] { request.ChitGroupId }, cancellationToken);
        if (group == null) return Result<int>.Failure("Chit Group not found.");

        // Check if installment already scheduled
        var existing = await _context.Auctions
            .AnyAsync(a => a.ChitGroupId == request.ChitGroupId && a.InstallmentNumber == request.InstallmentNumber, cancellationToken);
            
        if (existing) return Result<int>.Failure($"Auction for installment {request.InstallmentNumber} is already scheduled.");

        // Check bounds
        if (request.InstallmentNumber > group.DurationMonths)
            return Result<int>.Failure("Installment number cannot exceed group duration.");

        var auction = new Auction
        {
            ChitGroupId = request.ChitGroupId,
            InstallmentNumber = request.InstallmentNumber,
            AuctionDate = request.AuctionDate,
            AuctionStatus = "Scheduled" // TODO: Use Enum
        };

        _context.Auctions.Add(auction);
        await _context.SaveChangesAsync(cancellationToken);

        _staffNotification.Broadcast(
            "Auction Scheduled",
            $"Installment #{request.InstallmentNumber} for '{group.GroupName}' scheduled on {request.AuctionDate:dd MMM yyyy}.");

        return Result<int>.Success(auction.Id);
    }
}
