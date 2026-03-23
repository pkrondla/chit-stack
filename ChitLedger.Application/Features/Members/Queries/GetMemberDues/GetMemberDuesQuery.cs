using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Members.Queries.GetMemberDues;

public class MemberTicketDuesItemDto
{
    public int TicketId { get; set; }
    public int TicketNumber { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public decimal PendingPrincipal { get; set; }
    public decimal PendingPenalty { get; set; }
    public int OverdueDays { get; set; }
    public decimal AdvanceBalance { get; set; }
    public decimal TotalDue => PendingPrincipal + PendingPenalty;
    public DateTime? OldestDueDate { get; set; }
}

public class MemberDuesDto
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public decimal TotalPendingPrincipal => TicketDues.Sum(t => t.PendingPrincipal);
    public decimal TotalPendingPenalty => TicketDues.Sum(t => t.PendingPenalty);
    public decimal TotalAdvanceBalance => TicketDues.Sum(t => t.AdvanceBalance);
    public decimal TotalDue => TotalPendingPrincipal + TotalPendingPenalty;
    public List<MemberTicketDuesItemDto> TicketDues { get; set; } = new();
}

public class GetMemberDuesQuery : IRequest<Result<MemberDuesDto>>
{
    public int MemberId { get; set; }
}

public class GetMemberDuesHandler : IRequestHandler<GetMemberDuesQuery, Result<MemberDuesDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMemberDuesHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<MemberDuesDto>> Handle(GetMemberDuesQuery request, CancellationToken cancellationToken)
    {
        var member = await _context.Members
            .FirstOrDefaultAsync(m => m.Id == request.MemberId, cancellationToken);

        if (member == null) return Result<MemberDuesDto>.Failure("Member not found.");

        var tickets = await _context.Tickets
            .Include(t => t.ChitGroup)
            .Where(t => t.MemberId == request.MemberId && t.Status == Domain.Entities.TicketStatus.Active)
            .ToListAsync(cancellationToken);

        var memberTicketIds = tickets.Select(t => t.Id).ToList();

        var demands = await _context.Demands
            .Where(d => memberTicketIds.Contains(d.TicketId) && d.Status != "Paid")
            .ToListAsync(cancellationToken);

        var demandsByTicket = demands.GroupBy(d => d.TicketId).ToDictionary(g => g.Key, g => g.ToList());

        var dto = new MemberDuesDto
        {
            MemberId = member.Id,
            MemberName = member.FullName
        };

        var today = DateTime.Today;

        foreach (var ticket in tickets)
        {
            decimal principalUnpaidTotal = 0;
            decimal livePenaltyTotal = 0;
            int maxOverdueDays = 0;
            DateTime? oldest = null;

            var pendingDemands = demandsByTicket.ContainsKey(ticket.Id) ? demandsByTicket[ticket.Id] : new List<ChitLedger.Domain.Entities.Demand>();
            if (pendingDemands.Any())
            {
                oldest = pendingDemands.Min(d => (DateTime?)d.DueDate);
            }

            foreach (var d in pendingDemands)
            {
                // Unpaid principal is Gross Principal minus whatever was collected AFTER paying the penalty
                decimal principalAlreadyPaid = Math.Max(0, d.CollectedAmount - d.PenaltyAmount);
                decimal livePenaltyBase = Math.Max(0, d.NetAmount - principalAlreadyPaid);

                if (livePenaltyBase <= 0 && (d.NetAmount + d.PenaltyAmount - d.CollectedAmount) <= 0) continue;

                // Live Pro-Rata Penalty Calculation on the remaining principal balance
                int daysPastDue = (today - d.DueDate).Days;
                decimal livePenalty = 0;
                if (daysPastDue > ticket.ChitGroup.GracePeriodDays && livePenaltyBase > 0)
                {
                    decimal monthlyRate = ticket.ChitGroup.LateFeePercent;
                    decimal dailyRate = (monthlyRate / 100m) / 30m;
                    livePenalty = Math.Round(livePenaltyBase * dailyRate * daysPastDue, 2);
                    if (daysPastDue > maxOverdueDays) maxOverdueDays = daysPastDue;
                }

                // Use the higher of already recorded penalty or live penalty
                decimal effectivePenalty = Math.Max(d.PenaltyAmount, livePenalty);
                
                // Final balance check
                decimal currentRemainingTotal = (d.NetAmount + effectivePenalty) - d.CollectedAmount;
                if (currentRemainingTotal <= 0) continue;

                decimal penaltyUnpaid = 0;
                decimal principalUnpaid = 0;

                if (d.CollectedAmount >= effectivePenalty)
                {
                    penaltyUnpaid = 0;
                    principalUnpaid = (d.NetAmount + effectivePenalty) - d.CollectedAmount;
                }
                else
                {
                    penaltyUnpaid = effectivePenalty - d.CollectedAmount;
                    principalUnpaid = d.NetAmount;
                }

                principalUnpaidTotal += principalUnpaid;
                livePenaltyTotal += penaltyUnpaid;
            }

            if (principalUnpaidTotal > 0 || livePenaltyTotal > 0 || ticket.AdvanceBalance > 0)
            {
                dto.TicketDues.Add(new MemberTicketDuesItemDto
                {
                    TicketId = ticket.Id,
                    TicketNumber = ticket.TicketNumber,
                    GroupName = ticket.ChitGroup.GroupName,
                    PendingPrincipal = principalUnpaidTotal,
                    PendingPenalty = livePenaltyTotal,
                    OverdueDays = maxOverdueDays,
                    AdvanceBalance = ticket.AdvanceBalance,
                    OldestDueDate = oldest
                });
            }
        }

        // Order by settlement priority
        dto.TicketDues = dto.TicketDues.OrderByDescending(t => t.OldestDueDate.HasValue).ThenBy(t => t.OldestDueDate).ToList();

        return Result<MemberDuesDto>.Success(dto);
    }
}
