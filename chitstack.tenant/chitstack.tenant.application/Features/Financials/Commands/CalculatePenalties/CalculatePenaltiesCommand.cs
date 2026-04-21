using ChitStack.Application.Common.Constants;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Financials.Commands.CalculatePenalties;

public class CalculatePenaltiesCommand : IRequest<Result<int>>
{
    // Optional: Run for specific Group or Tenant. Default: All.
}

public class CalculatePenaltiesHandler : IRequestHandler<CalculatePenaltiesCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJournalService _journalService;
    private readonly IAccountResolutionService _accountService;
    private readonly IStaffNotificationService _staffNotification;

    public CalculatePenaltiesHandler(IApplicationDbContext context, IJournalService journalService, IAccountResolutionService accountService, IStaffNotificationService staffNotification)
    {
        _context = context;
        _journalService = journalService;
        _accountService = accountService;
        _staffNotification = staffNotification;
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
                    var receivableAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.MemberReceivable, cancellationToken);
                    var lateFeeAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.LateFeeIncome, cancellationToken);

                    if (!receivableAccount.Succeeded) return Result<int>.Failure(receivableAccount.Errors.First());
                    if (!lateFeeAccount.Succeeded) return Result<int>.Failure(lateFeeAccount.Errors.First());

                    var journalLines = new List<JournalLinePostingDto>
                    {
                        new JournalLinePostingDto 
                        { 
                            AccountCode = receivableAccount.Data, 
                            Debit = calculatedPenalty,
                            MemberId = demand.Ticket?.MemberId,
                            ChitGroupId = group.Id,
                            TicketId = demand.TicketId,
                            AuctionId = demand.AuctionId
                        },
                        new JournalLinePostingDto 
                        { 
                            AccountCode = lateFeeAccount.Data, 
                            Credit = calculatedPenalty,
                            MemberId = demand.Ticket?.MemberId,
                            ChitGroupId = group.Id,
                            TicketId = demand.TicketId,
                            AuctionId = demand.AuctionId
                        }
                    };
                    
                    await _journalService.CreateEntryAsync(
                        "Penalty", 
                        calculationDate, 
                        $"Late Fee for Ticket #{demand.Ticket.TicketNumber} (Inst {demand.InstallmentNumber})", 
                        demand.Id, 
                        "Demand", 
                        group.BranchId,
                        journalLines, 
                        cancellationToken);

                    updatedCount++;
                }
            }
        }

        if (updatedCount > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);

            _staffNotification.Broadcast(
                "Penalties Calculated",
                $"{updatedCount} overdue demand(s) have had late fees applied.");
        }

        return Result<int>.Success(updatedCount);
    }
}
