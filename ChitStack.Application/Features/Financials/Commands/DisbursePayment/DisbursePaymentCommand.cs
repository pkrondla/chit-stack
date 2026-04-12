using ChitStack.Application.Common.Constants;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Financials.Commands.DisbursePayment;

public class DisbursePaymentCommand : IRequest<Result<int>>
{
    public int AuctionId { get; set; }
    public string PaymentMode { get; set; } = "Bank";
    public string ReferenceNumber { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; } = DateTime.Now;
    public int? AccountHeadId { get; set; } // Optional: specific bank/cash account
}

public class DisbursePaymentHandler : IRequestHandler<DisbursePaymentCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJournalService _journalService;
    private readonly IAccountResolutionService _accountService;
    private readonly INotificationService _notificationService;
    private readonly IStaffNotificationService _staffNotification;

    public DisbursePaymentHandler(IApplicationDbContext context, IJournalService journalService, IAccountResolutionService accountService, INotificationService notificationService, IStaffNotificationService staffNotification)
    {
        _context = context;
        _journalService = journalService;
        _accountService = accountService;
        _notificationService = notificationService;
        _staffNotification = staffNotification;
    }

    public async Task<Result<int>> Handle(DisbursePaymentCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup)
            .Include(a => a.WinningTicket)
            .ThenInclude(t => t.Member)
            .FirstOrDefaultAsync(a => a.Id == request.AuctionId, cancellationToken);

        if (auction == null) return Result<int>.Failure("Auction not found.");
        if (auction.AuctionStatus != "Closed") return Result<int>.Failure("Auction must be closed to disburse payment.");
        if (auction.WinningTicketId == null) return Result<int>.Failure("No winner found for this auction.");
        
        if (auction.IsPaid) return Result<int>.Failure($"Payment already disbursed on {auction.PaymentDate?.ToShortDateString()}.");

        // Update Auction State
        auction.IsPaid = true;
        auction.PaymentDate = request.PaymentDate;
        auction.PaymentMode = request.PaymentMode;
        auction.PaymentReference = request.ReferenceNumber;

        // Journal Entry
        // Debit: Prize Payable (Liability decreasing)
        // Credit: Bank/Cash (Asset decreasing)
        
        var payableAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.PrizePayable, cancellationToken);
        if (!payableAccount.Succeeded) return Result<int>.Failure(payableAccount.Errors.First());

        string creditAccountCode;

        if (request.AccountHeadId.HasValue)
        {
            var account = await _context.AccountHeads.FindAsync(new object[] { request.AccountHeadId.Value }, cancellationToken);
            if (account == null) return Result<int>.Failure("Selected payment account not found.");
            creditAccountCode = account.AccountCode;
        }
        else
        {
            string role = request.PaymentMode == "Cash" ? AccountRoles.Cash : AccountRoles.Bank;
            var resolveResult = await _accountService.GetAccountCodeByRoleAsync(role, cancellationToken);
            if (!resolveResult.Succeeded) return Result<int>.Failure(resolveResult.Errors.First());
            creditAccountCode = resolveResult.Data;
        }

        var journalLines = new List<JournalLinePostingDto>
        {
            new JournalLinePostingDto 
            { 
                AccountCode = payableAccount.Data, 
                Debit = auction.NetPayableAmount,
                MemberId = auction.WinningTicket?.MemberId,
                ChitGroupId = auction.ChitGroupId,
                AuctionId = auction.Id
            },
            new JournalLinePostingDto 
            { 
                AccountCode = creditAccountCode, 
                Credit = auction.NetPayableAmount,
                MemberId = auction.WinningTicket?.MemberId,
                ChitGroupId = auction.ChitGroupId,
                AuctionId = auction.Id
            }
        };

        await _journalService.CreateEntryAsync(
            "Payout",
            request.PaymentDate,
            $"Prize Money Payout for Auction {auction.Id} - Ticket {auction.WinningTicket.TicketNumber}",
            auction.Id,
            "Auction",
            auction.BranchId,
            journalLines,
            cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        // Notify the winner that their prize money has been disbursed
        if (auction.WinningTicket?.MemberId != null)
        {
            var placeholders = new Dictionary<string, string>
            {
                { "MemberName", auction.WinningTicket.Member?.FullName ?? "Member" },
                { "Amount", auction.NetPayableAmount.ToString("N2") },
                { "ChitGroup", auction.ChitGroup.GroupName },
                { "RefNo", request.ReferenceNumber }
            };
            await _notificationService.SendTemplatedNotificationAsync(auction.WinningTicket.MemberId.Value, "PayoutDisbursement", placeholders);
        }

        _staffNotification.Broadcast(
            "Prize Disbursed",
            $"Auction #{auction.Id} ({auction.ChitGroup.GroupName}): ₹{auction.NetPayableAmount:N2} disbursed to {auction.WinningTicket?.Member?.FullName ?? "winner"} via {request.PaymentMode}. Ref: {request.ReferenceNumber}.",
            ChitStack.Domain.Entities.NotificationType.Success);

        return Result<int>.Success(auction.Id);
    }
}
