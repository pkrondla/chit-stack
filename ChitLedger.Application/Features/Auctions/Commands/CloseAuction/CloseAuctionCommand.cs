using ChitLedger.Application.Common.Constants;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Application.Features.Financials.Commands.GenerateDemands;
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
    private readonly IAccountResolutionService _accountService;
    private readonly IAuctionNotificationService _notificationService;
    private readonly INotificationService _persistentNotificationService;
    private readonly ISender _sender;

    public CloseAuctionHandler(IApplicationDbContext context, IGSTService gstService, IJournalService journalService, IAccountResolutionService accountService, IAuctionNotificationService notificationService, INotificationService persistentNotificationService, ISender sender)
    {
        _context = context;
        _gstService = gstService;
        _journalService = journalService;
        _accountService = accountService;
        _notificationService = notificationService;
        _persistentNotificationService = persistentNotificationService;
        _sender = sender;
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
        decimal maxBiddingAmount = Math.Round(auction.ChitGroup.ChitValue * (maxCapPercent / 100), 0, MidpointRounding.AwayFromZero);
        decimal minBiddingAmount = Math.Round(auction.ChitGroup.ChitValue * (auction.ChitGroup.ForemanCommissionPercent / 100), 0, MidpointRounding.AwayFromZero);

        if (auction.WinningBidAmount > maxBiddingAmount)
            return Result<int>.Failure($"Winning bid (₹{auction.WinningBidAmount:N2}) exceeds the maximum allowed discount of {maxCapPercent}% (₹{maxBiddingAmount:N2}).");

        // Enforce Foreman (Ticket 1) for first installment
        if (auction.InstallmentNumber == 1)
        {
            var foremanTicket = auction.ChitGroup.Tickets.FirstOrDefault(t => t.TicketNumber == 1);
            if (auction.WinningTicketId != foremanTicket?.Id)
                return Result<int>.Failure("As per Chit Fund rules, the first installment must be awarded to the Foreman (Ticket #1).");
            
            if (auction.WinningBidAmount > 0)
                return Result<int>.Failure("The first installment is drawn by the Foreman without any discount (₹0 bid).");
        }
        else if (auction.WinningBidAmount < minBiddingAmount)
        {
            return Result<int>.Failure($"Winning bid (₹{auction.WinningBidAmount:N2}) is below the minimum foreman commission of {auction.ChitGroup.ForemanCommissionPercent}% (₹{minBiddingAmount:N2}).");
        }

        // Calculate Dividend
        var commissionBase = Math.Round(auction.ChitGroup.ChitValue * (auction.ChitGroup.ForemanCommissionPercent / 100), 0, MidpointRounding.AwayFromZero);
        
        // Calculate GST on Commission
        decimal gstRate = settings?.GstPercent ?? 18;
        var (cgst, sgst) = _gstService.CalculateSplitGST(commissionBase, gstRate);
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
        
        var receivableAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.MemberReceivable, cancellationToken);
        var prizePayableAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.PrizePayable, cancellationToken);
        var incomeAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.CommissionIncome, cancellationToken);
        var cgstAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.CgstLiability, cancellationToken);
        var sgstAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.SgstLiability, cancellationToken);

        if (!receivableAccount.Succeeded) return Result<int>.Failure(receivableAccount.Errors.First());
        if (!prizePayableAccount.Succeeded) return Result<int>.Failure(prizePayableAccount.Errors.First());
        if (!incomeAccount.Succeeded) return Result<int>.Failure(incomeAccount.Errors.First());
        if (!cgstAccount.Succeeded) return Result<int>.Failure(cgstAccount.Errors.First());
        if (!sgstAccount.Succeeded) return Result<int>.Failure(sgstAccount.Errors.First());

        var journalLines = new List<JournalLinePostingDto>
        {
            // Total amount members contribute for this auction (Prize + Fee + GST)
            new JournalLinePostingDto 
            { 
                AccountCode = receivableAccount.Data, 
                Debit = auction.NetPayableAmount + commissionBase + totalGst, 
                ChitGroupId = auction.ChitGroupId,
                AuctionId = auction.Id
            }, 
            
            // Amount we owe the winner
            new JournalLinePostingDto 
            { 
                AccountCode = prizePayableAccount.Data, 
                Credit = auction.NetPayableAmount,
                MemberId = auction.WinningTicket?.MemberId,
                ChitGroupId = auction.ChitGroupId,
                AuctionId = auction.Id
            },
            
            // Foreman's earnings
            new JournalLinePostingDto { AccountCode = incomeAccount.Data, Credit = commissionBase, ChitGroupId = auction.ChitGroupId, AuctionId = auction.Id },
            new JournalLinePostingDto { AccountCode = cgstAccount.Data, Credit = cgst, ChitGroupId = auction.ChitGroupId, AuctionId = auction.Id },
            new JournalLinePostingDto { AccountCode = sgstAccount.Data, Credit = sgst, ChitGroupId = auction.ChitGroupId, AuctionId = auction.Id }
        };
        
        if (totalTds > 0)
        {
            var tdsAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.TdsLiability, cancellationToken);
            if (!tdsAccount.Succeeded) return Result<int>.Failure(tdsAccount.Errors.First());
            journalLines.Add(new JournalLinePostingDto { AccountCode = tdsAccount.Data, Credit = totalTds, ChitGroupId = auction.ChitGroupId, AuctionId = auction.Id });
        }
        
        var journalResult = await _journalService.CreateEntryAsync(
            "Auction-Close", 
            DateTime.Now, 
            $"Commission for Auction {auction.Id}", 
            auction.Id, 
            "Auction", 
            auction.BranchId,
            journalLines, 
            cancellationToken);

        if (!journalResult.Succeeded)
            return Result<int>.Failure($"Failed to create journal entry: {journalResult.Errors.First()}");

        // Close Group if this is the final installment
        if (auction.InstallmentNumber >= auction.ChitGroup.DurationMonths)
        {
            auction.ChitGroup.Status = Domain.Entities.GroupStatus.Completed;
        }

        await _context.SaveChangesAsync(cancellationToken);

        // 6. Send Automated Persistent Notifications
        // 6.1 Notify Winner
        if (auction.WinningTicket?.MemberId != null)
        {
            var winnerValues = new Dictionary<string, string>
            {
                { "MemberName", auction.WinningTicket.Member.FullName },
                { "ChitGroup", auction.ChitGroup.GroupName },
                { "BidAmount", auction.WinningBidAmount.ToString("N2") },
                { "Payout", auction.NetPayableAmount.ToString("N2") }
            };
            await _persistentNotificationService.SendTemplatedNotificationAsync(auction.WinningTicket.MemberId.Value, "AuctionWinner", winnerValues);
        }

        // 6.2 Notify All Members about Dividend
        // Fetch all member IDs in this group
        var groupMembers = await _context.Tickets
            .Where(t => t.ChitGroupId == auction.ChitGroupId && t.MemberId != null)
            .Select(t => new { t.MemberId, t.TicketNumber })
            .ToListAsync(cancellationToken);

        foreach (var m in groupMembers)
        {
            var divValues = new Dictionary<string, string>
            {
                { "Amount", auction.DividendAmount.ToString("N2") },
                { "ChitGroup", auction.ChitGroup.GroupName },
                { "NetInstallment", (auction.ChitGroup.InstallmentAmount - auction.DividendAmount).ToString("N2") }
            };
            await _persistentNotificationService.SendTemplatedNotificationAsync(m.MemberId.Value, "DividendCredit", divValues);
        }

        // Notify Room
        await _notificationService.NotifyAuctionClosedAsync(
            auction.Id, 
            auction.WinningTicketId.Value, 
            auction.WinningTicket?.Member?.FullName ?? "Member", 
            auction.WinningBidAmount);

        // Auto-Generate Demands!
        var demandsResult = await _sender.Send(new GenerateDemandsCommand { AuctionId = auction.Id }, cancellationToken);

        return Result<int>.Success(auction.Id);
    }
}
