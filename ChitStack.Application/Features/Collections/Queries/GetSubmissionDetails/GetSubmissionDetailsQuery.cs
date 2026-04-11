using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Collections.Queries.GetSubmissionDetails;

public class SubmissionDetailsDto
{
    public int Id { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public DateTime SubmissionDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<SubmissionReceiptDto> Receipts { get; set; } = new();
}

public class SubmissionReceiptDto
{
    public int Id { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = string.Empty;
    public string ReferenceNumber { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? PhotoUrl { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal? MemberLatitude { get; set; }
    public decimal? MemberLongitude { get; set; }
    public string? AgentName { get; set; }
}

public class GetSubmissionDetailsQuery : IRequest<Result<SubmissionDetailsDto>>
{
    public int Id { get; set; }
}

public class GetSubmissionDetailsHandler : IRequestHandler<GetSubmissionDetailsQuery, Result<SubmissionDetailsDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSubmissionDetailsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<SubmissionDetailsDto>> Handle(GetSubmissionDetailsQuery request, CancellationToken cancellationToken)
    {
        var result = await _context.CollectionSubmissions
            .Include(s => s.Agent)
            .Include(s => s.Receipts)
                .ThenInclude(r => r.Ticket)
                    .ThenInclude(t => t.Member)
            .Where(s => s.Id == request.Id)
            .Select(s => new SubmissionDetailsDto
            {
                Id = s.Id,
                AgentName = s.Agent.FullName,
                SubmissionDate = s.SubmissionDate,
                TotalAmount = s.TotalAmount,
                Status = s.Status,
                Receipts = s.Receipts.Select(r => new SubmissionReceiptDto
                {
                    Id = r.Id,
                    MemberName = r.Ticket.Member != null ? r.Ticket.Member.FullName : "Unknown",
                    Amount = r.AmountReceived,
                    PaymentMode = r.PaymentMode,
                    ReferenceNumber = r.ReferenceNumber,
                    Date = r.ReceiptDate,
                    PhotoUrl = r.TransactionPhotoUrl,
                    Latitude = r.Latitude,
                    Longitude = r.Longitude,
                    MemberLatitude = r.Ticket.Member != null ? r.Ticket.Member.Latitude : null,
                    MemberLongitude = r.Ticket.Member != null ? r.Ticket.Member.Longitude : null
                }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (result == null) return Result<SubmissionDetailsDto>.Failure("Submission not found.");

        return Result<SubmissionDetailsDto>.Success(result);
    }
}
