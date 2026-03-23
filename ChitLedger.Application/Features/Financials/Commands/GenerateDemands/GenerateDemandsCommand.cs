using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Financials.Commands.GenerateDemands;

public class GenerateDemandsCommand : IRequest<Result<int>>
{
    public int AuctionId { get; set; }
}

public class GenerateDemandsHandler : IRequestHandler<GenerateDemandsCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public GenerateDemandsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(GenerateDemandsCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup)
            .ThenInclude(g => g.Tickets)
            .FirstOrDefaultAsync(a => a.Id == request.AuctionId, cancellationToken);
            
        if (auction == null) return Result<int>.Failure("Auction not found.");
        
        if (auction.AuctionStatus != "Closed") 
            return Result<int>.Failure("Auction must be closed to generate demands.");

        // Check if demands already exist
        var existing = await _context.Demands.AnyAsync(d => d.AuctionId == request.AuctionId, cancellationToken);
        if (existing) return Result<int>.Failure("Demands already generated for this auction.");

        var demands = new List<Demand>();
        var dueDate = auction.AuctionDate.AddDays(10); // Example: Due 10 days after auction? Or manual.

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

        return Result<int>.Success(demands.Count);
    }
}
