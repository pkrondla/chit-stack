using ChitLedger.Application.Common.Constants;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Financials.Commands.DisbursePayment;

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

    public DisbursePaymentHandler(IApplicationDbContext context, IJournalService journalService, IAccountResolutionService accountService)
    {
        _context = context;
        _journalService = journalService;
        _accountService = accountService;
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

        return Result<int>.Success(auction.Id);
    }
}
