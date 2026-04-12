using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Financials.Commands.GenerateDemands;

public class GenerateDemandsCommand : IRequest<Result<int>>
{
    public int AuctionId { get; set; }
}

public class GenerateDemandsHandler : IRequestHandler<GenerateDemandsCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IStaffNotificationService _staffNotification;

    public GenerateDemandsHandler(IApplicationDbContext context, INotificationService notificationService, IStaffNotificationService staffNotification)
    {
        _context = context;
        _notificationService = notificationService;
        _staffNotification = staffNotification;
    }

    public async Task<Result<int>> Handle(GenerateDemandsCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup)
            .ThenInclude(g => g.Tickets)
            .ThenInclude(t => t.Member)
            .FirstOrDefaultAsync(a => a.Id == request.AuctionId, cancellationToken);
            
        if (auction == null) return Result<int>.Failure("Auction not found.");
        
        if (auction.AuctionStatus != "Closed") 
            return Result<int>.Failure("Auction must be closed to generate demands.");

        // Check if demands already exist
        var existing = await _context.Demands.AnyAsync(d => d.AuctionId == request.AuctionId, cancellationToken);
        if (existing) return Result<int>.Failure("Demands already generated for this auction.");

        var demands = new List<Demand>();
        var dueDate = auction.AuctionDate; // Due date is exactly the auction date.

        foreach (var ticket in auction.ChitGroup.Tickets)
        {
            // For the winner, if they bid, they usually just pay the Net check?
            // Actually, usually EVERYONE pays the Installment - Dividend.
            // The WINNER also pays the same Installment - Dividend for that month 
            // OR the prize money is adjusted. 
            // Standard: Everyone pays. Net Payable to winner is separate transaction.
            
            // NOTE: Non-prized tickets get dividend.
            // Prized tickets (from PAST auctions) usually DO NOT get dividend in some schemes, or DO get dividend in others.
            // Chit Fund Act: "Dividend is distributed to ALL subscribers" (unless defaulting).
            // Let's assume Dividend applies to ALL tickets.
            
            var netDemand = auction.ChitGroup.InstallmentAmount - auction.DividendAmount;
            decimal advanceDeducted = 0;
            if (ticket.AdvanceBalance > 0)
            {
                advanceDeducted = Math.Min(ticket.AdvanceBalance, netDemand);
                ticket.AdvanceBalance -= advanceDeducted;
            }

            var demand = new Demand
            {
                TenantId = auction.TenantId,
                BranchId = auction.BranchId,
                TicketId = ticket.Id,
                AuctionId = auction.Id,
                InstallmentNumber = auction.InstallmentNumber,
                GrossAmount = auction.ChitGroup.InstallmentAmount,
                DividendAmount = auction.DividendAmount, 
                NetAmount = netDemand,
                CollectedAmount = advanceDeducted,
                Status = advanceDeducted >= netDemand ? "Paid" : (advanceDeducted > 0 ? "Partial" : "Pending"),
                DueDate = dueDate
            };
            
            demands.Add(demand);
        }

        _context.Demands.AddRange(demands);
        await _context.SaveChangesAsync(cancellationToken);

        _staffNotification.Broadcast(
            "Demands Generated",
            $"{demands.Count} demand(s) generated for '{auction.ChitGroup.GroupName}' installment #{auction.InstallmentNumber} (₹{(auction.ChitGroup.InstallmentAmount - auction.DividendAmount):N2} each).");

        // Notify Members about new Demand
        foreach (var ticket in auction.ChitGroup.Tickets)
        {
            if (ticket.MemberId.HasValue)
            {
                var placeholders = new Dictionary<string, string>
                {
                    { "Month", auction.AuctionDate.ToString("MMMM yyyy") },
                    { "Amount", (auction.ChitGroup.InstallmentAmount - auction.DividendAmount).ToString("N2") },
                    { "DueDate", auction.AuctionDate.ToShortDateString() },
                    { "ChitGroup", auction.ChitGroup.GroupName }
                };

                await _notificationService.SendTemplatedNotificationAsync(ticket.MemberId.Value, "DemandAlert", placeholders);
            }
        }

        return Result<int>.Success(demands.Count);
    }
}
