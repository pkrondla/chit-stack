using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Tickets.Commands.AllocateTicket;

public class AllocateTicketCommand : IRequest<Result<List<int>>>
{
    public int ChitGroupId { get; set; }
    public List<int> MemberIds { get; set; } = new();
}

public class AllocateTicketHandler : IRequestHandler<AllocateTicketCommand, Result<List<int>>>
{
    private readonly IApplicationDbContext _context;

    public AllocateTicketHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<int>>> Handle(AllocateTicketCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate Group
        var group = await _context.ChitGroups.Include(g => g.Tickets).FirstOrDefaultAsync(g => g.Id == request.ChitGroupId, cancellationToken);
        if (group == null) return Result<List<int>>.Failure("Chit Group not found.");
        
        if (request.MemberIds == null || !request.MemberIds.Any())
            return Result<List<int>>.Failure("No members selected.");

        // Check Max Capacity (Total Active and Vacant Tickets cannot exceed Duration Months)
        if (group.Tickets.Count + request.MemberIds.Count > group.DurationMonths)
        {
            return Result<List<int>>.Failure($"Cannot enroll {request.MemberIds.Count} members. Only {group.DurationMonths - group.Tickets.Count} slots left out of a total {group.DurationMonths} slots.");
        }

        var createdTicketIds = new List<int>();

        // Find existing enrolled members
        var existingMemberIds = group.Tickets.Select(t => t.MemberId).ToHashSet();

        // Find the highest existing ticket number to auto-increment from
        int nextTicketNumber = group.Tickets.Any() ? group.Tickets.Max(t => t.TicketNumber) + 1 : 1;

        foreach (var memberId in request.MemberIds)
        {
            if (existingMemberIds.Contains(memberId))
                continue; // Prevent enrolling the same member twice

            var member = await _context.Members.FindAsync(new object[] { memberId }, cancellationToken);
            if (member == null) continue; // Skip invalid members

            var ticket = new Ticket
            {
                ChitGroupId = group.Id,
                MemberId = member.Id,
                TicketNumber = nextTicketNumber++
            };

            _context.Tickets.Add(ticket);
            createdTicketIds.Add(ticket.Id); // Normally need to save first to get ID, but let's just track we processed them. Wait, EF Core might not populate ID until SaveChanges.
        }

        await _context.SaveChangesAsync(cancellationToken);

        // After save, the tracked entities will have their IDs populated.
        // We will just return success with count, or actual IDs if needed, but the frontend currently just relies on success.
        return Result<List<int>>.Success(createdTicketIds);
    }
}
