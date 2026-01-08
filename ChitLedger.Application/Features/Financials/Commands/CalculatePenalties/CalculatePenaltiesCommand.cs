using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Financials.Commands.CalculatePenalties;

public class CalculatePenaltiesCommand : IRequest<Result<int>>
{
    // Optional: Run for specific Group or Tenant. Default: All.
}

public class CalculatePenaltiesHandler : IRequestHandler<CalculatePenaltiesCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJournalService _journalService;

    public CalculatePenaltiesHandler(IApplicationDbContext context, IJournalService journalService)
    {
        _context = context;
        _journalService = journalService;
    }

    public async Task<Result<int>> Handle(CalculatePenaltiesCommand request, CancellationToken cancellationToken)
    {
        var calculationDate = DateTime.Now;
        int updatedCount = 0;

        // 1. Get all active groups with their demands
        var activeGroups = await _context.ChitGroups
            .Where(g => g.Status == Domain.Entities.GroupStatus.Active)
            .Include(g => g.Tickets) // Not strictly needed if we query Demands directly but useful for context
            .ToListAsync(cancellationToken);

        foreach (var group in activeGroups)
        {
            // 2. Find overdue pending demands for this group
            var overdueDemands = await _context.Demands
                .Where(d => d.Ticket.ChitGroupId == group.Id 
                            && (d.Status == "Pending" || d.Status == "Partial")
                            && d.DueDate.AddDays(group.GracePeriodDays) < calculationDate)
                .ToListAsync(cancellationToken);

            foreach (var demand in overdueDemands)
            {
                // 3. Calculate Penalty
                // Formula: 2% of Net Amount (Flat for now, per month logic is clearer but complex)
                // Let's implement: Max(ExistingPenalty, CalculatedPenalty) to avoid overwriting manually adjusted ones?
                // Or just apply fixed logic: 
                // Penalty = NetAmount * (Percent / 100)
                
                decimal calculatedPenalty = demand.NetAmount * (group.LateFeePercent / 100);
                
                // Only update if not already applied (or maybe we allow re-calc?)
                if (demand.PenaltyAmount == 0)
                {
                    demand.PenaltyAmount = calculatedPenalty;
                    
                    // Journal Entry: Accrue Late Fee Income
                    // Debit: Receivable (Member owes this)
                    // Credit: Late Fee Income
                    var journalLines = new List<(string, decimal, decimal)>
                    {
                        ("RECEIVABLE-MEMBER", calculatedPenalty, 0),
                        ("INCOME-LATE-FEE", 0, calculatedPenalty)
                    };
                    
                    await _journalService.CreateEntryAsync(
                        "Penalty", 
                        calculationDate, 
                        $"Late Fee for Ticket #{demand.Ticket.TicketNumber} (Inst {demand.InstallmentNumber})", 
                        demand.Id, 
                        "Demand", 
                        journalLines, 
                        cancellationToken);

                    updatedCount++;
                }
            }
        }

        if (updatedCount > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Result<int>.Success(updatedCount);
    }
}
