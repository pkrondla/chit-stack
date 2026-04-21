using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Collections.Queries.GetSubmissions;

public class SubmissionDto
{
    public int Id { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public DateTime SubmissionDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TotalCash { get; set; }
    public decimal TotalCheque { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ReceiptCount { get; set; }
}

public class GetSubmissionsQuery : IRequest<Result<List<SubmissionDto>>>
{
    public string? Status { get; set; }
}

public class GetSubmissionsHandler : IRequestHandler<GetSubmissionsQuery, Result<List<SubmissionDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetSubmissionsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<SubmissionDto>>> Handle(GetSubmissionsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.CollectionSubmissions
            .Include(s => s.Agent)
            .Include(s => s.Receipts)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.Status))
        {
            query = query.Where(s => s.Status == request.Status);
        }

        var result = await query
            .OrderByDescending(s => s.SubmissionDate)
            .Select(s => new SubmissionDto
            {
                Id = s.Id,
                AgentName = s.Agent.FullName,
                SubmissionDate = s.SubmissionDate,
                TotalAmount = s.TotalAmount,
                TotalCash = s.TotalCash,
                TotalCheque = s.TotalCheque,
                Status = s.Status,
                ReceiptCount = s.Receipts.Count
            })
            .ToListAsync(cancellationToken);

        return Result<List<SubmissionDto>>.Success(result);
    }
}
