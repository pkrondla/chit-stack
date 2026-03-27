using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Application.Features.Collections.Queries.GetSubmissionDetails;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Collections.Queries.GetAgentReceipts;

public class GetAgentReceiptsQuery : IRequest<Result<List<SubmissionReceiptDto>>>
{
}

public class GetAgentReceiptsHandler : IRequestHandler<GetAgentReceiptsQuery, Result<List<SubmissionReceiptDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAgentReceiptsHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<SubmissionReceiptDto>>> Handle(GetAgentReceiptsQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            return Result<List<SubmissionReceiptDto>>.Failure("User not authenticated.");

        var currentUserId = int.Parse(_currentUserService.UserId);

        var receipts = await _context.Receipts
            .Include(r => r.Ticket)
                .ThenInclude(t => t.Member)
            .Where(r => r.AgentId == currentUserId && r.Status == "Pending")
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
                Longitude = r.Longitude
            })
            .ToListAsync(cancellationToken);

        return Result<List<SubmissionReceiptDto>>.Success(receipts);
    }
}
