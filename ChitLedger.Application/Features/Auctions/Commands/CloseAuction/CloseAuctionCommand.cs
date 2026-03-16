using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Auctions.Commands.CloseAuction;

public class CloseAuctionCommand : IRequest<Result<int>>
{
    public int AuctionId { get; set; }
}

public class CloseAuctionHandler : IRequestHandler<CloseAuctionCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IGSTService _gstService;
    private readonly IJournalService _journalService;
    private readonly IAuctionNotificationService _notificationService;

    public CloseAuctionHandler(IApplicationDbContext context, IGSTService gstService, IJournalService journalService, IAuctionNotificationService notificationService)
    {
        _context = context;
        _gstService = gstService;
        _journalService = journalService;
        _notificationService = notificationService;
    }

    public async Task<Result<int>> Handle(CloseAuctionCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup)
            .ThenInclude(g => g.Tickets)
            .Include(a => a.WinningTicket)
            .ThenInclude(t => t.Member)
            .FirstOrDefaultAsync(a => a.Id == request.AuctionId, cancellationToken);
            
        if (auction == null) return Result<int>.Failure("Auction not found.");
        
        if (auction.WinningTicketId == null)
            return Result<int>.Failure("Cannot close auction without a winner.");

        // Statutoty Validations
        var settings = await _context.TenantSettings.FirstOrDefaultAsync(cancellationToken);
        decimal maxCapPercent = settings?.MaxBiddingDiscountPercent ?? 40;
        decimal maxBiddingAmount = auction.ChitGroup.ChitValue * (maxCapPercent / 100);
        decimal minBiddingAmount = auction.ChitGroup.ChitValue * (auction.ChitGroup.ForemanCommissionPercent / 100);

        if (auction.WinningBidAmount > maxBiddingAmount)
            return Result<int>.Failure($"Winning bid (₹{auction.WinningBidAmount:N2}) exceeds the maximum allowed discount of {maxCapPercent}% (₹{maxBiddingAmount:N2}).");

        if (auction.WinningBidAmount < minBiddingAmount && auction.InstallmentNumber > 1)
            return Result<int>.Failure($"Winning bid (₹{auction.WinningBidAmount:N2}) is below the minimum foreman commission of {auction.ChitGroup.ForemanCommissionPercent}% (₹{minBiddingAmount:N2}).");

        // Calculate Dividend
        var commissionBase = auction.ChitGroup.ChitValue * (auction.ChitGroup.ForemanCommissionPercent / 100);
        
        // Calculate GST on Commission
        var (cgst, sgst) = _gstService.CalculateSplitGST(commissionBase);
        var totalGst = cgst + sgst;
        
        // Distributable Surplus = WinningBid - (Commission + GST is typically NOT deducted from dividend pool, but collected from winner or paid by foreman? 
        // Chit Act: 5% Commission is max. GST is extra. "Foreman shall be entitled to ... commission not exceeding 5%".
        // GST is typically explicitly collected or inclusive. Let's assume GST is EXTRA liability for the company, but here we record it as liability.
        // Usually: Winning Bid is the "Discount".
        // Commission = 5% of Chit Value.
        // Distributed Dividend = Discount - Commission.
        // GST is calculated on Commission.
        
        var distributableSurplus = auction.WinningBidAmount - commissionBase;
        if (distributableSurplus < 0) distributableSurplus = 0;

        var totalTickets = auction.ChitGroup.Tickets.Count;
        if (totalTickets == 0) return Result<int>.Failure("No tickets in group to distribute dividend.");

        var dividendPerTicket = distributableSurplus / totalTickets;
        
        // TDS Calculation
        decimal totalTds = 0;
        if (settings != null && settings.TdsPercent > 0)
        {
            // Calculate TDS on Distributable Surplus (Total Gain)
            totalTds = distributableSurplus * (settings.TdsPercent / 100);
        }

        auction.ForemanCommissionAmount = commissionBase;
        // Dividend stored is NET of TDS
        auction.DividendAmount = (distributableSurplus - totalTds) / totalTickets; 
        auction.TdsAmount = totalTds;
        auction.NetPayableAmount = auction.ChitGroup.ChitValue - auction.WinningBidAmount;
        auction.AuctionStatus = "Closed";

        // Mark Ticket as Prized
        var winningTicket = auction.ChitGroup.Tickets.First(t => t.Id == auction.WinningTicketId);
        winningTicket.IsPrized = true;
        winningTicket.PrizedInstallment = auction.InstallmentNumber;
        
        // Journal Entry: Accrue Commission Income
        // Debit: Foreman Commission Receivable (Asset) or adjust from Payout
        // Credit: Commission Income (Revenue)
        // Credit: Output CGST (Liability)
        // Credit: Output SGST (Liability)
        
        // In simple terms: The winner receives (ChitValue - Discount). The Company earns Commission. The Members earn Dividend.
        // We will just record the Income recognition here.
        
        var journalLines = new List<(string AccountCode, decimal Debit, decimal Credit)>
        {
            ("RECEIVABLE-COMMISSION", commissionBase + totalGst, 0), // Pending receipt from Payout adjustment
            ("INCOME-COMMISSION", 0, commissionBase),
            ("LIABILITY-CGST", 0, cgst),
            ("LIABILITY-SGST", 0, sgst)
        };
        
        if (totalTds > 0)
        {
            journalLines.Add(("LIABILITY-TDS", 0, totalTds));
        }
        
        await _journalService.CreateEntryAsync(
            "Auction-Close", 
            DateTime.Now, 
            $"Commission for Auction {auction.Id}", 
            auction.Id, 
            "Auction", 
            auction.BranchId,
            journalLines, 
            cancellationToken);

        // Schedule Next Auction or Close Group
        if (auction.InstallmentNumber < auction.ChitGroup.DurationMonths)
        {
            var nextAuction = new Domain.Entities.Auction
            {
                ChitGroupId = auction.ChitGroupId,
                InstallmentNumber = auction.InstallmentNumber + 1,
                AuctionDate = auction.AuctionDate.AddMonths(1),
                AuctionStatus = "Scheduled",
                WinningBidAmount = 0,
                DividendAmount = 0,
                NetPayableAmount = 0
            };
            _context.Auctions.Add(nextAuction);
        }
        else
        {
            auction.ChitGroup.Status = Domain.Entities.GroupStatus.Completed;
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Notify Room
        await _notificationService.NotifyAuctionClosedAsync(
            auction.Id, 
            auction.WinningTicketId.Value, 
            auction.WinningTicket?.Member?.FullName ?? "Member", 
            auction.WinningBidAmount);

        return Result<int>.Success(auction.Id);
    }
}
