using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;

namespace ChitStack.Application.Features.Financials.Commands.CreateJournalEntry;

public class CreateJournalEntryCommand : IRequest<Result<int>>
{
    public DateTime EntryDate { get; set; } = DateTime.Now;
    public string EntryType { get; set; } = "General"; // Receipt, Payment, Contra, Journal, General
    public string Description { get; set; } = string.Empty;
    public int? BranchId { get; set; }
    public List<JournalLineDto> Lines { get; set; } = new List<JournalLineDto>();
}

public class JournalLineDto
{
    public string AccountCode { get; set; } = string.Empty;
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
}

public class CreateJournalEntryHandler : IRequestHandler<CreateJournalEntryCommand, Result<int>>
{
    private readonly IJournalService _journalService;
    private readonly IStaffNotificationService _staffNotification;

    public CreateJournalEntryHandler(IJournalService journalService, IStaffNotificationService staffNotification)
    {
        _journalService = journalService;
        _staffNotification = staffNotification;
    }

    public async Task<Result<int>> Handle(CreateJournalEntryCommand request, CancellationToken cancellationToken)
    {
        if (request.Lines == null || !request.Lines.Any())
            return Result<int>.Failure("Journal entry must have at least one line.");

        var totalDebit = request.Lines.Sum(x => x.Debit);
        var totalCredit = request.Lines.Sum(x => x.Credit);

        if (totalDebit != totalCredit)
            return Result<int>.Failure($"Trial balance mismatch: Total Debit ({totalDebit}) != Total Credit ({totalCredit}).");

        if (totalDebit == 0)
            return Result<int>.Failure("Journal entry amount cannot be zero.");

        var serviceLines = request.Lines
            .Select(x => new JournalLinePostingDto
            {
                AccountCode = x.AccountCode,
                Debit = x.Debit,
                Credit = x.Credit
            })
            .ToList();

        var result = await _journalService.CreateEntryAsync(
            request.EntryType,
            request.EntryDate,
            request.Description,
            null,
            "General",
            request.BranchId,
            serviceLines,
            cancellationToken);

        if (result.Succeeded)
        {
            _staffNotification.Broadcast(
                "Journal Entry Posted",
                $"{request.EntryType} journal entry: \"{request.Description}\" (₹{totalDebit:N2}) posted for {request.EntryDate:dd MMM yyyy}.");
        }

        return result;
    }
}
