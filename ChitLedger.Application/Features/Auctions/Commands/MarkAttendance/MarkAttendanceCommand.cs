using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Auctions.Commands.MarkAttendance;

public class MarkAttendanceCommand : IRequest<Result<bool>>
{
    public int AuctionId { get; set; }
    public int TicketId { get; set; }
    public bool IsPresent { get; set; }
}

public class MarkAttendanceHandler : IRequestHandler<MarkAttendanceCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuctionNotificationService _notificationService;

    public MarkAttendanceHandler(IApplicationDbContext context, IAuctionNotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<Result<bool>> Handle(MarkAttendanceCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions.FindAsync(new object[] { request.AuctionId }, cancellationToken);
        if (auction == null) return Result<bool>.Failure("Auction not found.");

        var ticket = await _context.Tickets
            .IgnoreQueryFilters()
            .Include(t => t.Member)
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);
            
        if (ticket == null) return Result<bool>.Failure("Ticket not found.");

        try 
        {
             var attendance = await _context.AuctionAttendances
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.AuctionId == request.AuctionId && a.TicketId == request.TicketId, cancellationToken);

            if (attendance == null)
            {
                if (request.IsPresent)
                {
                    attendance = new AuctionAttendance
                    {
                        AuctionId = request.AuctionId,
                        TicketId = request.TicketId,
                        IsPresent = true,
                        IsActive = true,
                        AttendanceTime = DateTime.UtcNow,
                        BranchId = auction.BranchId,
                        TenantId = auction.TenantId
                    };
                    _context.AuctionAttendances.Add(attendance);
                }
            }
            else
            {
                attendance.IsPresent = request.IsPresent;
                attendance.AttendanceTime = request.IsPresent ? DateTime.UtcNow : null;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure("Failed to update attendance records. This might be due to a missing database table. Please contact administrator.");
        }

        // Notify Room
        await _notificationService.NotifyAttendanceAsync(
            request.AuctionId, 
            request.TicketId, 
            ticket.Member?.FullName ?? $"Ticket #{ticket.TicketNumber}", 
            request.IsPresent);

        return Result<bool>.Success(true);
    }
}
