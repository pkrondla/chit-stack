using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Tickets.Queries.GetTicketDues;

public class TicketDuesDto
{
    public int TicketId { get; set; }
    public decimal PendingPrincipal { get; set; }
    public decimal PendingPenalty { get; set; }
    public decimal TotalDue => PendingPrincipal + PendingPenalty;
    public string MemberName { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
}

public class GetTicketDuesQuery : IRequest<Result<TicketDuesDto>>
{
    public int TicketId { get; set; }
}

public class GetTicketDuesHandler : IRequestHandler<GetTicketDuesQuery, Result<TicketDuesDto>>
{
    private readonly IApplicationDbContext _context;

    public GetTicketDuesHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<TicketDuesDto>> Handle(GetTicketDuesQuery request, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Member)
            .Include(t => t.ChitGroup)
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket == null) return Result<TicketDuesDto>.Failure("Ticket not found.");

        var demands = await _context.Demands
            .Where(d => d.TicketId == request.TicketId && d.Status != "Paid")
            .ToListAsync(cancellationToken);

        decimal principal = 0;
        decimal penalty = 0;

        foreach (var d in demands)
        {
            // Calculate how much is pending
            // Formula in RecordPayment: pending = (Net + Penalty) - Collected.
            // But we don't track "Collected Principal" vs "Collected Penalty" separately in DB field.
            // Assumption: Collected Amount pays Penalty FIRST.
            
            decimal totalDemand = d.NetAmount + d.PenaltyAmount;
            decimal remaining = totalDemand - d.CollectedAmount;
            
            if (remaining <= 0) continue; // Should be 'Paid' status but double check
            
            // Re-derive split
            // If Collected < Penalty, then Penalty is partially paid, Principal is fully pending.
            // If Collected >= Penalty, Penalty is fully paid, Principal is partially paid.
            
            decimal penaltyUnpaid = 0;
            decimal principalUnpaid = 0;
            
            if (d.CollectedAmount >= d.PenaltyAmount)
            {
                 penaltyUnpaid = 0;
                 principalUnpaid = remaining; // All remaining is principal
            }
            else
            {
                 penaltyUnpaid = d.PenaltyAmount - d.CollectedAmount;
                 principalUnpaid = d.NetAmount;
            }
            
            principal += principalUnpaid;
            penalty += penaltyUnpaid;
        }

        return Result<TicketDuesDto>.Success(new TicketDuesDto
        {
            TicketId = ticket.Id,
            MemberName = ticket.Member.FullName,
            GroupName = ticket.ChitGroup.GroupName,
            PendingPrincipal = principal,
            PendingPenalty = penalty
        });
    }
}
