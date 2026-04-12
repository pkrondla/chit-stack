using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Financials.Commands.ReconcileTransactions;

public class ReconcileTransactionsCommand : IRequest<Result<int>>
{
    public List<int> JournalEntryLineIds { get; set; } = new();
    public DateTime ReconciliationDate { get; set; } = DateTime.Now;
}

public class ReconcileTransactionsHandler : IRequestHandler<ReconcileTransactionsCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IStaffNotificationService _staffNotification;

    public ReconcileTransactionsHandler(IApplicationDbContext context, IStaffNotificationService staffNotification)
    {
        _context = context;
        _staffNotification = staffNotification;
    }

    public async Task<Result<int>> Handle(ReconcileTransactionsCommand request, CancellationToken cancellationToken)
    {
        var lines = await _context.JournalEntryLines
            .Where(l => request.JournalEntryLineIds.Contains(l.Id))
            .ToListAsync(cancellationToken);

        foreach (var line in lines)
        {
            line.IsReconciled = true;
            line.ReconciliationDate = request.ReconciliationDate;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _staffNotification.Broadcast(
            "Transactions Reconciled",
            $"{lines.Count} journal line(s) marked as reconciled on {request.ReconciliationDate:dd MMM yyyy}.");

        return Result<int>.Success(lines.Count);
    }
}
