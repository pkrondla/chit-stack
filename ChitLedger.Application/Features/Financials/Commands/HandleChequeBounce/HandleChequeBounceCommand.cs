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

    public HandleChequeBounceHandler(IApplicationDbContext context, IJournalService journalService)
    {
        _context = context;
        _journalService = journalService;
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
            var reversalLines = new List<(string AccountCode, decimal Debit, decimal Credit)>();
            foreach (var line in journalEntry.Lines)
            {
                var account = await _context.AccountHeads.FindAsync(new object[] { line.AccountHeadId }, cancellationToken);
                if (account != null)
                {
                    reversalLines.Add((account.AccountCode, line.CreditAmount, line.DebitAmount));
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
            var chargeLines = new List<(string AccountCode, decimal Debit, decimal Credit)>
            {
                ("RECEIVABLE-MEMBER", request.BounceCharge, 0),
                ("INCOME-BOUNCE-CHARGES", 0, request.BounceCharge)
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
