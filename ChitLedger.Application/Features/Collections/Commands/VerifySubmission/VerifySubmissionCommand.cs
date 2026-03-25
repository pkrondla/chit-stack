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

    public VerifySubmissionHandler(IApplicationDbContext context, IJournalService journalService, IAccountResolutionService accountService, ICurrentUserService currentUserService)
    {
        _context = context;
        _journalService = journalService;
        _accountService = accountService;
        _currentUserService = currentUserService;
    }

    public async Task<Result<int>> Handle(VerifySubmissionCommand request, CancellationToken cancellationToken)
    {
        var submission = await _context.CollectionSubmissions
            .Include(s => s.Receipts)
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

            var journalLines = new List<(string AccountCode, decimal Debit, decimal Credit)>
            {
                (resolveResult.Data!, receipt.AmountReceived, 0m),
                (receivableAccount.Data!, 0m, receipt.AmountReceived)
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

        return Result<int>.Success(submission.Id);
    }
}
