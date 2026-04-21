using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Tickets.Commands.RemoveSubscriber;

public class RemoveSubscriberCommand : IRequest<Result<int>>
{
    public int TicketId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class RemoveSubscriberHandler : IRequestHandler<RemoveSubscriberCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public RemoveSubscriberHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(RemoveSubscriberCommand request, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets
            .Include(t => t.ChitGroup)
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket == null) return Result<int>.Failure("Ticket not found.");
        
        if (ticket.IsForeman) return Result<int>.Failure("The Foreman ticket cannot be removed.");
        if (ticket.IsPrized) return Result<int>.Failure("Cannot remove a Prized subscriber. Settle the liability first.");
        if (ticket.Status == TicketStatus.Removed || ticket.Status == TicketStatus.Vacant) 
            return Result<int>.Failure("Ticket is already inactive.");

        // Mark as Vacant
        // In a real system, we calculated "Actual Amount Paid" - "Commission" -> Refundable.
        // And created a Liability for the refund.
        // For MVP, we just mark it Vacant so it can be re-assigned.
        
        ticket.Status = TicketStatus.Vacant;
        ticket.RemovalDate = DateTime.Now;
        ticket.MemberId = null;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(ticket.Id);
    }
}
