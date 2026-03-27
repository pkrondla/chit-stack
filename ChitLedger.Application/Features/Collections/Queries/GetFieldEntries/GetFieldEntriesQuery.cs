using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Application.Features.Collections.Queries.GetSubmissionDetails;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Collections.Queries.GetFieldEntries;

public class GetFieldEntriesQuery : IRequest<Result<List<SubmissionReceiptDto>>>
{
}

public class GetFieldEntriesHandler : IRequestHandler<GetFieldEntriesQuery, Result<List<SubmissionReceiptDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetFieldEntriesHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<SubmissionReceiptDto>>> Handle(GetFieldEntriesQuery request, CancellationToken cancellationToken)
    {
        var receipts = await _context.Receipts
            .Include(r => r.Ticket)
                .ThenInclude(t => t.Member)
            .Include(r => r.Agent)
            .Where(r => r.Status == "Pending")
            .OrderByDescending(r => r.ReceiptDate)
            .Select(r => new SubmissionReceiptDto
            {
                Id = r.Id,
                MemberName = r.Ticket.Member != null ? r.Ticket.Member.FullName : "Unknown",
                Amount = r.AmountReceived,
                PaymentMode = r.PaymentMode,
                ReferenceNumber = r.ReferenceNumber ?? "",
                Date = r.ReceiptDate,
                PhotoUrl = r.TransactionPhotoUrl,
                Latitude = r.Latitude,
                Longitude = r.Longitude,
                MemberLatitude = r.Ticket.Member != null ? r.Ticket.Member.Latitude : null,
                MemberLongitude = r.Ticket.Member != null ? r.Ticket.Member.Longitude : null,
                AgentName = r.Agent != null ? r.Agent.FullName : "Unknown"
            })
            .ToListAsync(cancellationToken);

        return Result<List<SubmissionReceiptDto>>.Success(receipts);
    }
}
