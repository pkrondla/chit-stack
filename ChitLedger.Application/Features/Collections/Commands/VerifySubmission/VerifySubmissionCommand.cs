using ChitLedger.Application.Common.Constants;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Collections.Commands.VerifySubmission;

public class VerifySubmissionCommand : IRequest<Result<int>>
{
    public int SubmissionId { get; set; }
    public string Remarks { get; set; } = string.Empty;
}

public class VerifySubmissionHandler : IRequestHandler<VerifySubmissionCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJournalService _journalService;
    private readonly IAccountResolutionService _accountService;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;

    public VerifySubmissionHandler(IApplicationDbContext context, IJournalService journalService, IAccountResolutionService accountService, ICurrentUserService currentUserService, INotificationService notificationService)
    {
        _context = context;
        _journalService = journalService;
        _accountService = accountService;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
    }

    public async Task<Result<int>> Handle(VerifySubmissionCommand request, CancellationToken cancellationToken)
    {
        var submission = await _context.CollectionSubmissions
            .Include(s => s.Receipts)
                .ThenInclude(r => r.Ticket)
            .FirstOrDefaultAsync(s => s.Id == request.SubmissionId, cancellationToken);

        if (submission == null) return Result<int>.Failure("Submission not found.");
        if (submission.Status == "Verified") return Result<int>.Failure("Collection already verified.");

        int.TryParse(_currentUserService.UserId, out int currentUserId);

        foreach (var receipt in submission.Receipts.Where(r => r.Status == "Pending"))
        {
            receipt.Status = "Submitted";
            
            // Generate Journal Entry for each verified receipt
            string role = receipt.PaymentMode == "Cash" ? AccountRoles.Cash : AccountRoles.Bank;
            var resolveResult = await _accountService.GetAccountCodeByRoleAsync(role, cancellationToken);
            if (!resolveResult.Succeeded) continue; 
            
            string debitAccountCode = resolveResult.Data;

            var receivableAccount = await _accountService.GetAccountCodeByRoleAsync(AccountRoles.MemberReceivable, cancellationToken);
            if (!receivableAccount.Succeeded) continue;

            var journalLines = new List<JournalLinePostingDto>
            {
                new JournalLinePostingDto 
                { 
                    AccountCode = resolveResult.Data!, 
                    Debit = receipt.AmountReceived,
                    MemberId = receipt.Ticket?.MemberId,
                    ChitGroupId = receipt.Ticket?.ChitGroupId,
                    TicketId = receipt.TicketId,
                    AuctionId = receipt.AuctionId
                },
                new JournalLinePostingDto 
                { 
                    AccountCode = receivableAccount.Data!, 
                    Credit = receipt.AmountReceived,
                    MemberId = receipt.Ticket?.MemberId,
                    ChitGroupId = receipt.Ticket?.ChitGroupId,
                    TicketId = receipt.TicketId,
                    AuctionId = receipt.AuctionId
                }
            };

            await _journalService.CreateEntryAsync(
                "Receipt", 
                receipt.ReceiptDate, 
                $"Verified Receipt #{receipt.Id} from Collection Agent (Submission #{submission.Id})", 
                receipt.Id, 
                "Receipt", 
                receipt.BranchId,
                journalLines, 
                cancellationToken);
        }

        submission.Status = "Verified";
        submission.VerifiedAt = DateTime.Now;
        submission.VerifiedByUserId = currentUserId > 0 ? currentUserId : null;
        submission.Remarks = request.Remarks;

        await _context.SaveChangesAsync(cancellationToken);

        // Notify Agent
        var agentValues = new Dictionary<string, string>
        {
            { "Date", submission.SubmissionDate.ToShortDateString() },
            { "Amount", submission.TotalAmount.ToString("N2") },
            { "Status", "Verified" }
        };
        await _notificationService.SendUserTemplatedNotificationAsync(submission.AgentId, "ReconciliationApproval", agentValues);

        return Result<int>.Success(submission.Id);
    }
}
