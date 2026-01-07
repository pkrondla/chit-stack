using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Tickets.Commands.AllocateTicket;

public class AllocateTicketCommand : IRequest<Result<int>>
{
    public int ChitGroupId { get; set; }
    public int MemberId { get; set; }
    public int TicketNumber { get; set; } // Optional, or auto-assigned
}

public class AllocateTicketHandler : IRequestHandler<AllocateTicketCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public AllocateTicketHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(AllocateTicketCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate Group
        var group = await _context.ChitGroups.Include(g => g.Tickets).FirstOrDefaultAsync(g => g.Id == request.ChitGroupId, cancellationToken);
        if (group == null) return Result<int>.Failure("Chit Group not found.");
        
        // 2. Validate Member
        var member = await _context.Members.FindAsync(new object[] { request.MemberId }, cancellationToken);
        if (member == null) return Result<int>.Failure("Member not found.");

        // 3. Logic: Check max tickets
        // Chit Act usually limits ticket count per person? Let's skip regulatory checks for MVP, assume Valid.
        // Check if ticket number taken
        if (group.Tickets.Any(t => t.TicketNumber == request.TicketNumber))
        {
             return Result<int>.Failure($"Ticket number {request.TicketNumber} is already allocated.");
        }

        var ticket = new Ticket
        {
            ChitGroupId = group.Id,
            MemberId = member.Id,
            TicketNumber = request.TicketNumber
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(ticket.Id);
    }
}
