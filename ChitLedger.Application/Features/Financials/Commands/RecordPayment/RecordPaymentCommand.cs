using ChitLedger.Application.Common.Constants;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Financials.Commands.RecordPayment;

public class RecordPaymentCommand : IRequest<Result<int>>
{
    public int? TicketId { get; set; }
    public int? MemberId { get; set; }
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
        // 1. Validate Input
        if (request.TicketId == null && request.MemberId == null)
            return Result<int>.Failure("TicketId or MemberId is required.");

        // 2. Find pending demands (FIFO by Due Date/Installment)
        var pendingDemandsQuery = _context.Demands.Where(d => d.Status != "Paid");

        if (request.TicketId.HasValue)
        {
            pendingDemandsQuery = pendingDemandsQuery.Where(d => d.TicketId == request.TicketId.Value)
                                                     .OrderBy(d => d.InstallmentNumber);
        }
        else if (request.MemberId.HasValue)
        {
            pendingDemandsQuery = pendingDemandsQuery.Where(d => d.Ticket.MemberId == request.MemberId.Value)
                                                     .OrderBy(d => d.DueDate).ThenBy(d => d.InstallmentNumber);
        }

        var pendingDemands = await pendingDemandsQuery
            .Include(d => d.Ticket) // Needed for branch id and numbers
            .ToListAsync(cancellationToken);

        var transactionDate = request.PaymentDate;
        decimal amountRemaining = request.Amount;
        
        Ticket targetTicket = null;
        int? branchId = null;
        
        if (!pendingDemands.Any()) 
        {
            // Advance Payment Logic
            if (request.TicketId.HasValue)
            {
                targetTicket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == request.TicketId.Value);
            }
            else 
            {
                return Result<int>.Failure("To record a pure advance payment with no outstanding dues, you must explicitly specify the target Ticket/Group.");
            }
            
            if (targetTicket == null) return Result<int>.Failure("No active ticket found to accept this advance payment.");
            branchId = targetTicket.BranchId;
        }
        else
        {
            targetTicket = pendingDemands.First().Ticket;
            branchId = targetTicket.BranchId;
        }

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
        
        // Log excess to Advance Balance
        if (amountRemaining > 0 && targetTicket != null)
        {
            targetTicket.AdvanceBalance += amountRemaining;
        }
        
        // 3. Create Receipt
        int auctionIdToLink = 0;
        if (pendingDemands.Any())
        {
            auctionIdToLink = pendingDemands.First().AuctionId;
        }
        else
        {
            var latestAuction = await _context.Auctions
                .Where(a => a.ChitGroupId == targetTicket.ChitGroupId)
                .OrderByDescending(a => a.InstallmentNumber)
                .FirstOrDefaultAsync(cancellationToken);
            
            if (latestAuction == null) return Result<int>.Failure("Chit Group has no auctions to tie the advance payment to.");
            auctionIdToLink = latestAuction.Id;
        }

        var receipt = new Receipt
        {
            TenantId = targetTicket.TenantId,
            BranchId = targetTicket.BranchId,
            TicketId = targetTicket.Id,
            AuctionId = auctionIdToLink,
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
            $"Receipt #{receipt.Id} {(request.MemberId.HasValue ? "from Member" : "from Ticket " + targetTicket.TicketNumber)} {(amountRemaining > 0 ? "(Includes Advance)" : "")}", 
            receipt.Id,  
            "Receipt", 
            branchId,
            journalLines, 
            cancellationToken);

        return Result<int>.Success(receipt.Id);
    }
}
