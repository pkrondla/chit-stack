using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Admin.Commands.PurgeAuditLogs;

public class PurgeAuditLogsCommand : IRequest<Result<int>>
{
    public DateTime BeforeDate { get; set; }
}

public class PurgeAuditLogsHandler : IRequestHandler<PurgeAuditLogsCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public PurgeAuditLogsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(PurgeAuditLogsCommand request, CancellationToken cancellationToken)
    {
        var logsToRemove = await _context.AuditLogs
            .Where(l => l.Timestamp < request.BeforeDate)
            .ToListAsync(cancellationToken);

        int count = logsToRemove.Count;
        if (count > 0)
        {
            _context.AuditLogs.RemoveRange(logsToRemove);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Result<int>.Success(count);
    }
}
