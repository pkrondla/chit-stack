using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Financials.Commands.ReconcileTransactions;

public class ReconcileTransactionsCommand : IRequest<Result<int>>
{
    public List<int> JournalEntryLineIds { get; set; } = new();
    public DateTime ReconciliationDate { get; set; } = DateTime.Now;
}

public class ReconcileTransactionsHandler : IRequestHandler<ReconcileTransactionsCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public ReconcileTransactionsHandler(IApplicationDbContext context)
    {
        _context = context;
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

        return Result<int>.Success(lines.Count);
    }
}
