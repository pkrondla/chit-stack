using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Collections.Commands.ProposeEnrollment;

public class ProposeEnrollmentCommand : IRequest<Result<int>>
{
    public int TicketId { get; set; }
    public int MemberId { get; set; }
}

public class ProposeEnrollmentHandler : IRequestHandler<ProposeEnrollmentCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public ProposeEnrollmentHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(ProposeEnrollmentCommand request, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets
            .Include(t => t.ChitGroup)
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket == null) return Result<int>.Failure("Ticket not found.");
        if (ticket.MemberId != null) return Result<int>.Failure("Ticket is already occupied.");

        ticket.MemberId = request.MemberId;
        ticket.Status = TicketStatus.Pending;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(ticket.Id);
    }
}
