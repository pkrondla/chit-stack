using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Tickets.Queries.GetTicketDues;

public class InstallmentItemDto
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

public class TicketDuesDto
{
    public int TicketId { get; set; }
    public decimal GrossPrincipal => Installments.Sum(i => i.GrossPrincipal);
    public decimal Dividend => Installments.Sum(i => i.Dividend);
    public decimal PendingPrincipal => Installments.Sum(i => i.PendingPrincipal);
    public decimal PendingPenalty => Installments.Sum(i => i.PendingPenalty);
    public int OverdueDays => Installments.Any() ? Installments.Max(i => i.OverdueDays) : 0;
    public decimal TotalDue => PendingPrincipal + PendingPenalty;
    public decimal AdvanceBalance { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public List<InstallmentItemDto> Installments { get; set; } = new();
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

        var dto = new TicketDuesDto
        {
            TicketId = ticket.Id,
            MemberName = ticket.Member.FullName,
            GroupName = ticket.ChitGroup.GroupName,
            AdvanceBalance = ticket.AdvanceBalance
        };

        var today = DateTime.Today;

        foreach (var d in demands)
        {
            // Unpaid principal is Gross Principal minus whatever was collected AFTER paying the penalty
            decimal principalAlreadyPaid = Math.Max(0, d.CollectedAmount - d.PenaltyAmount);
            decimal livePenaltyBase = Math.Max(0, d.NetAmount - principalAlreadyPaid);

            if (livePenaltyBase <= 0 && (d.NetAmount + d.PenaltyAmount - d.CollectedAmount) <= 0) continue;

            // Live Pro-Rata Penalty Calculation on the remaining principal balance
            int daysPastDue = (today - d.DueDate).Days;
            decimal livePenalty = 0;
            int overdueDays = 0;
            if (daysPastDue > ticket.ChitGroup.GracePeriodDays && livePenaltyBase > 0)
            {
                decimal monthlyRate = ticket.ChitGroup.LateFeePercent;
                decimal dailyRate = (monthlyRate / 100m) / 30m;
                livePenalty = Math.Round(livePenaltyBase * dailyRate * daysPastDue, 2);
                overdueDays = daysPastDue;
            }

            // Use the higher of already recorded penalty or live penalty
            decimal effectivePenalty = Math.Max(d.PenaltyAmount, livePenalty);
            
            decimal totalDemand = d.NetAmount + effectivePenalty;
            decimal remaining = totalDemand - d.CollectedAmount;
            
            if (remaining <= 0) continue;
            
            decimal penaltyUnpaid = 0;
            decimal principalUnpaid = 0;
            
            if (d.CollectedAmount >= effectivePenalty)
            {
                 penaltyUnpaid = 0;
                 principalUnpaid = remaining;
            }
            else
            {
                 penaltyUnpaid = effectivePenalty - d.CollectedAmount;
                 principalUnpaid = d.NetAmount;
            }
            
            dto.Installments.Add(new InstallmentItemDto
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

        return Result<TicketDuesDto>.Success(dto);
    }
}
