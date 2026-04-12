using ChitStack.Application.Common.Constants;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Application.Features.Financials.Commands.GenerateDemands;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Auctions.Commands.CloseAuction;

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
    private readonly IStaffNotificationService _staffNotification;
    private readonly ISender _sender;

    public CloseAuctionHandler(IApplicationDbContext context, IGSTService gstService, IJournalService journalService, IAccountResolutionService accountService, IAuctionNotificationService notificationService, INotificationService persistentNotificationService, IStaffNotificationService staffNotification, ISender sender)
    {
        _context = context;
        _gstService = gstService;
        _journalService = journalService;
        _accountService = accountService;
        _notificationService = notificationService;
        _persistentNotificationService = persistentNotificationService;
        _staffNotification = staffNotification;
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
        // GST is typically explicitly collected or inclusive. Let's assume GST is EXTRA liability for the company, but here we record it as liability.
        // Usually: Winning Bid is the "Discount".
        // Commission = 5% of Chit Value.
        // Distributed Dividend = Discount - Commission.
        // GST is calculated on Commission.
        // Calculate Dividend
        var rawDistributableSurplus = auction.WinningBidAmount - commissionBase;
        if (rawDistributableSurplus < 0) rawDistributableSurplus = 0;

        var totalTickets = auction.ChitGroup.Tickets.Count;
        if (totalTickets == 0) return Result<int>.Failure("No tickets in group to distribute dividend.");

        // Calculate TDS on Distributable Surplus
        decimal totalTds = 0;
        if (settings != null && settings.TdsPercent > 0)
        {
            totalTds = rawDistributableSurplus * (settings.TdsPercent / 100);
        }

        // Round Dividend to nearest Rupee
        decimal rawDividendPerTicket = (rawDistributableSurplus - totalTds) / totalTickets;
        decimal roundedDividendPerTicket = Math.Round(rawDividendPerTicket, 0, MidpointRounding.AwayFromZero);

        auction.ForemanCommissionAmount = commissionBase;
        auction.DividendAmount = roundedDividendPerTicket;
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
        var roundingAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.DividendRoundingOff, cancellationToken);

        if (!receivableAccount.Succeeded) return Result<int>.Failure(receivableAccount.Errors.First());
        if (!prizePayableAccount.Succeeded) return Result<int>.Failure(prizePayableAccount.Errors.First());
        if (!incomeAccount.Succeeded) return Result<int>.Failure(incomeAccount.Errors.First());
        if (!cgstAccount.Succeeded) return Result<int>.Failure(cgstAccount.Errors.First());
        if (!sgstAccount.Succeeded) return Result<int>.Failure(sgstAccount.Errors.First());
        if (!roundingAccount.Succeeded) return Result<int>.Failure(roundingAccount.Errors.First());

        // Calculate Accounting Imbalance due to Rounding
        // Debit (Receivable) must match Credits (Prize + Income + Tax + TDS)
        decimal totalReceivableAmount = totalTickets * (auction.ChitGroup.InstallmentAmount - roundedDividendPerTicket);
        decimal totalCreditAmount = auction.NetPayableAmount + commissionBase + totalGst + totalTds;
        decimal roundingDiff = totalReceivableAmount - totalCreditAmount;

        var journalLines = new List<JournalLinePostingDto>
        {
            // Total amount members contribute for this auction (Net Installment × Tickets)
            new JournalLinePostingDto 
            { 
                AccountCode = receivableAccount.Data, 
                Debit = totalReceivableAmount, 
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

        // Add Rounding Entry if any
        if (roundingDiff != 0)
        {
            journalLines.Add(new JournalLinePostingDto
            {
                AccountCode = roundingAccount.Data,
                Credit = roundingDiff > 0 ? roundingDiff : 0,
                Debit = roundingDiff < 0 ? Math.Abs(roundingDiff) : 0,
                ChitGroupId = auction.ChitGroupId,
                AuctionId = auction.Id
            });
        }
        
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

        _staffNotification.Broadcast(
            "Auction Closed",
            $"Auction #{auction.Id} (installment #{auction.InstallmentNumber}, '{auction.ChitGroup.GroupName}') closed. Winner: {auction.WinningTicket?.Member?.FullName ?? "Ticket #" + auction.WinningTicket?.TicketNumber}, Bid: ₹{auction.WinningBidAmount:N2}.",
            NotificationType.Success);

        // Auto-Generate Demands!
        var demandsResult = await _sender.Send(new GenerateDemandsCommand { AuctionId = auction.Id }, cancellationToken);

        return Result<int>.Success(auction.Id);
    }
}
