using ChitLedger.Application.Common.Constants;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Financials.Commands.RecordPayment;

public class RecordPaymentCommand : IRequest<Result<int>>
{
    public int TicketId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = "Cash";
    public string ReferenceNumber { get; set; } = string.Empty;
    public int? AccountHeadId { get; set; } // Optional: specific bank/cash account
    public DateTime PaymentDate { get; set; } = DateTime.Now;
}

public class RecordPaymentHandler : IRequestHandler<RecordPaymentCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJournalService _journalService;
    private readonly IAccountResolutionService _accountService;

    public RecordPaymentHandler(IApplicationDbContext context, IJournalService journalService, IAccountResolutionService accountService)
    {
        _context = context;
        _journalService = journalService;
        _accountService = accountService;
    }

    public async Task<Result<int>> Handle(RecordPaymentCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate Ticket
        var ticket = await _context.Tickets.FindAsync(new object[] { request.TicketId }, cancellationToken);
        if (ticket == null) return Result<int>.Failure("Ticket not found.");

        // 2. Determine which Demand to pay? (FIFO usually)
        // Find oldest pending demands
        var pendingDemands = await _context.Demands
            .Where(d => d.TicketId == ticket.Id && d.Status != "Paid")
            .OrderBy(d => d.InstallmentNumber)
            .ToListAsync(cancellationToken);

        if (!pendingDemands.Any()) 
            return Result<int>.Failure("No pending demands for this ticket.");

        decimal amountRemaining = request.Amount;
        var transactionDate = request.PaymentDate;

        // Auto-allocate against demands
        foreach (var demand in pendingDemands)
        {
            if (amountRemaining <= 0) break;

            var pendingOnDemand = (demand.NetAmount + demand.PenaltyAmount) - demand.CollectedAmount;
            
            if (amountRemaining >= pendingOnDemand)
            {
                // Full settle this demand
                demand.CollectedAmount += pendingOnDemand;
                demand.Status = "Paid";
                amountRemaining -= pendingOnDemand;
            }
            else
            {
                // Partial settle
                demand.CollectedAmount += amountRemaining;
                demand.Status = "Partial";
                amountRemaining = 0;
            }
        }
        
        // 3. Create Receipt
        // Ideally we link Receipt to one or more demands. But for MVP, we link to Ticket+Auction(Latest?).
        // Or just Ticket.
        // Let's link to the *last* auction/installment covered? 
        // For simplicity, we just log the receipt. The Demand updates are the source of truth for "Paid/Not Paid".
        
        var receipt = new Receipt
        {
            TicketId = request.TicketId,
            AuctionId = pendingDemands.First().AuctionId, // Link to the first demand served? Arbitrary.
            AmountReceived = request.Amount,
            PaymentMode = request.PaymentMode,
            ReferenceNumber = request.ReferenceNumber,
            ReceiptDate = transactionDate
        };

        _context.Receipts.Add(receipt);
        await _context.SaveChangesAsync(cancellationToken);
        
        // 4. Journal Entry: Cash Receipt
        // Debit: Cash/Bank (Asset)
        // Credit: Member Receivable (Asset - reducing)
        
        string debitAccountCode;

        if (request.AccountHeadId.HasValue)
        {
            var account = await _context.AccountHeads.FindAsync(new object[] { request.AccountHeadId.Value }, cancellationToken);
            if (account == null) return Result<int>.Failure("Selected receipt account not found.");
            debitAccountCode = account.AccountCode;
        }
        else
        {
            string role = request.PaymentMode == "Cash" ? AccountRoles.Cash : AccountRoles.Bank;
            var resolveResult = await _accountService.GetAccountCodeByRoleAsync(role, cancellationToken);
            if (!resolveResult.Succeeded) return Result<int>.Failure(resolveResult.Errors.First());
            debitAccountCode = resolveResult.Data;
        }

        var receivableAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.MemberReceivable, cancellationToken);
        if (!receivableAccount.Succeeded) return Result<int>.Failure(receivableAccount.Errors.First());

        var journalLines = new List<(string AccountCode, decimal Debit, decimal Credit)>
        {
            (debitAccountCode, request.Amount, 0),
            (receivableAccount.Data, 0, request.Amount)
        };
        
        await _journalService.CreateEntryAsync(
            "Receipt", 
            transactionDate, 
            $"Receipt #{receipt.Id} from Ticket {ticket.TicketNumber}", 
            receipt.Id, 
            "Receipt", 
            ticket.BranchId,
            journalLines, 
            cancellationToken);

        return Result<int>.Success(receipt.Id);
    }
}
