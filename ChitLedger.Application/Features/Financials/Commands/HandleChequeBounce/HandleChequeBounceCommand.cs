using ChitLedger.Application.Common.Constants;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Financials.Commands.HandleChequeBounce;

public class HandleChequeBounceCommand : IRequest<Result<int>>
{
    public int ReceiptId { get; set; }
    public decimal BounceCharge { get; set; }
    public DateTime BounceDate { get; set; } = DateTime.Now;
    public string Remarks { get; set; } = string.Empty;
}

public class HandleChequeBounceHandler : IRequestHandler<HandleChequeBounceCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJournalService _journalService;
    private readonly IAccountResolutionService _accountService;

    public HandleChequeBounceHandler(IApplicationDbContext context, IJournalService journalService, IAccountResolutionService accountService)
    {
        _context = context;
        _journalService = journalService;
        _accountService = accountService;
    }

    public async Task<Result<int>> Handle(HandleChequeBounceCommand request, CancellationToken cancellationToken)
    {
        var receipt = await _context.Receipts
            .Include(r => r.Ticket)
            .FirstOrDefaultAsync(r => r.Id == request.ReceiptId, cancellationToken);

        if (receipt == null) return Result<int>.Failure("Receipt not found.");

        // 1. Find the corresponding Journal Entry
        var journalEntry = await _context.JournalEntries
            .Include(e => e.Lines)
            .FirstOrDefaultAsync(e => e.ReferenceId == receipt.Id && e.ReferenceType == "Receipt", cancellationToken);

        if (journalEntry != null)
        {
            journalEntry.InstrumentStatus = "Bounced";
            
            // 2. Create Reversal Journal Entry
            // Debit: Member Receivable (Asset increasing again)
            // Credit: Cash/Bank (Asset decreasing)
            var reversalLines = new List<JournalLinePostingDto>();
            foreach (var line in journalEntry.Lines)
            {
                var account = await _context.AccountHeads.FindAsync(new object[] { line.AccountHeadId }, cancellationToken);
                if (account != null)
                {
                    reversalLines.Add(new JournalLinePostingDto 
                    { 
                        AccountCode = account.AccountCode, 
                        Debit = line.CreditAmount, 
                        Credit = line.DebitAmount,
                        MemberId = line.MemberId,
                        ChitGroupId = line.ChitGroupId,
                        TicketId = line.TicketId,
                        AuctionId = line.AuctionId
                    });
                }
            }

            await _journalService.CreateEntryAsync(
                "Bounce-Reversal",
                request.BounceDate,
                $"Reversal of Receipt #{receipt.Id} due to Bounce. {request.Remarks}",
                receipt.Id,
                "Receipt",
                receipt.BranchId,
                reversalLines,
                cancellationToken);
        }

        // 3. Apply Bounce Charges
        if (request.BounceCharge > 0)
        {
            // Debit: Member Receivable (Asset)
            // Credit: Bounce Charge Income (Income)
            var receivableAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.MemberReceivable, cancellationToken);
            var bounceIncomeAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.BounceChargeIncome, cancellationToken);

            if (!receivableAccount.Succeeded) return Result<int>.Failure(receivableAccount.Errors.First());
            if (!bounceIncomeAccount.Succeeded) return Result<int>.Failure(bounceIncomeAccount.Errors.First());

            var chargeLines = new List<JournalLinePostingDto>
            {
                new JournalLinePostingDto 
                { 
                    AccountCode = receivableAccount.Data, 
                    Debit = request.BounceCharge,
                    MemberId = receipt.Ticket?.MemberId,
                    ChitGroupId = receipt.Ticket?.ChitGroupId,
                    TicketId = receipt.TicketId,
                    AuctionId = receipt.AuctionId
                },
                new JournalLinePostingDto 
                { 
                    AccountCode = bounceIncomeAccount.Data, 
                    Credit = request.BounceCharge,
                    MemberId = receipt.Ticket?.MemberId,
                    ChitGroupId = receipt.Ticket?.ChitGroupId,
                    TicketId = receipt.TicketId,
                    AuctionId = receipt.AuctionId
                }
            };

            await _journalService.CreateEntryAsync(
                "Bounce-Charge",
                request.BounceDate,
                $"Cheque Bounce Charges for Receipt #{receipt.Id}",
                receipt.Id,
                "Receipt",
                receipt.BranchId,
                chargeLines,
                cancellationToken);
        }

        // 4. Reset Demands linked to this Receipt (simplified)
        // In a real system, we'd need to know exactly which demands this receipt paid.
        // For now, we manually adjust if needed or just let the user re-pay them.

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(receipt.Id);
    }
}
