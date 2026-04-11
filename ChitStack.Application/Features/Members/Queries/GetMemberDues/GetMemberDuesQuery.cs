using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Members.Queries.GetMemberDues;

public class InstallmentDuesDto
{
    public int InstallmentNumber { get; set; }
    public DateTime DueDate { get; set; }
    public decimal GrossPrincipal { get; set; }
    public decimal Dividend { get; set; }
    public decimal PendingPrincipal { get; set; }
    public decimal PendingPenalty { get; set; }
    public int OverdueDays { get; set; }
    public decimal TotalDue => PendingPrincipal + PendingPenalty;
}

public class MemberTicketDuesItemDto
{
    public int TicketId { get; set; }
    public int TicketNumber { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public decimal GrossPrincipal => Installments.Sum(i => i.GrossPrincipal);
    public decimal Dividend => Installments.Sum(i => i.Dividend);
    public decimal PendingPrincipal => Installments.Sum(i => i.PendingPrincipal);
    public decimal PendingPenalty => Installments.Sum(i => i.PendingPenalty);
    public int OverdueDays => Installments.Any() ? Installments.Max(i => i.OverdueDays) : 0;
    public decimal AdvanceBalance { get; set; }
    public decimal TotalDue => PendingPrincipal + PendingPenalty;
    public DateTime? OldestDueDate { get; set; }
    public List<InstallmentDuesDto> Installments { get; set; } = new();
}

public class MemberDuesDto
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public decimal TotalGrossPrincipal => TicketDues.Sum(t => t.GrossPrincipal);
    public decimal TotalDividend => TicketDues.Sum(t => t.Dividend);
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
            var itemDto = new MemberTicketDuesItemDto
            {
                TicketId = ticket.Id,
                TicketNumber = ticket.TicketNumber,
                GroupName = ticket.ChitGroup.GroupName,
                AdvanceBalance = ticket.AdvanceBalance
            };

            var pendingDemands = demandsByTicket.ContainsKey(ticket.Id) ? demandsByTicket[ticket.Id] : new List<ChitStack.Domain.Entities.Demand>();
            if (pendingDemands.Any())
            {
                itemDto.OldestDueDate = pendingDemands.Min(d => (DateTime?)d.DueDate);
            }

            foreach (var d in pendingDemands)
            {
                // Use shared helper for consistent calculation
                var calculation = ChitStack.Application.Common.Helpers.PenaltyCalculator.Calculate(d, ticket.ChitGroup);
                decimal effectivePenalty = calculation.EffectivePenalty;
                decimal currentRemainingTotal = calculation.TotalOutstanding;
                int overdueDays = calculation.OverdueDays;

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

                itemDto.Installments.Add(new InstallmentDuesDto
                {
                    InstallmentNumber = d.InstallmentNumber,
                    DueDate = d.DueDate,
                    GrossPrincipal = d.GrossAmount,
                    Dividend = d.DividendAmount,
                    PendingPrincipal = principalUnpaid,
                    PendingPenalty = penaltyUnpaid,
                    OverdueDays = overdueDays
                });
            }

            if (itemDto.Installments.Any() || itemDto.AdvanceBalance > 0)
            {
                dto.TicketDues.Add(itemDto);
            }
        }

        // Order by settlement priority
        dto.TicketDues = dto.TicketDues.OrderByDescending(t => t.OldestDueDate.HasValue).ThenBy(t => t.OldestDueDate).ToList();

        return Result<MemberDuesDto>.Success(dto);
    }
}
