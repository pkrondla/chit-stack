using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Tickets.Commands.AssignVacancy;

public class AssignVacancyCommand : IRequest<Result<int>>
{
    public int TicketId { get; set; }
    public int NewMemberId { get; set; }
}

public class AssignVacancyHandler : IRequestHandler<AssignVacancyCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public AssignVacancyHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(AssignVacancyCommand request, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets
            .Include(t => t.ChitGroup)
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket == null) return Result<int>.Failure("Ticket not found.");
        
        if (ticket.IsForeman) return Result<int>.Failure("The Foreman ticket cannot be assigned to a member.");
        if (ticket.Status != TicketStatus.Vacant) 
            return Result<int>.Failure("Ticket is not vacant.");

        var member = await _context.Members.FindAsync(new object[] { request.NewMemberId }, cancellationToken);
        if (member == null) return Result<int>.Failure("New Member not found.");

        // Assign to new member
        ticket.MemberId = request.NewMemberId;
        ticket.Status = TicketStatus.Active;
        ticket.RemovalDate = null;
        
        // Note: The new member takes over liabilities. 
        // In real world, "Removal" involves refunding old member, and new member pays "Arrears".
        // Here we assume the switch happens.

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(ticket.Id);
    }
}
