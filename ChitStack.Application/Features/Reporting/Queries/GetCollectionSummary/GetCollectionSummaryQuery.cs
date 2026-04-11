using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Reporting.Queries.GetCollectionSummary;

public class CollectionSummaryDto
{
    public List<PaymentModeSummaryDto> Modes { get; set; } = new();
    public List<AgentPerformanceDto> AgentPerformance { get; set; } = new();
    public decimal GrandTotal { get; set; }
}

public class PaymentModeSummaryDto
{
    public string Mode { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int ReceiptCount { get; set; }
}

public class AgentPerformanceDto
{
    public int AgentId { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public decimal TotalCollected { get; set; }
    public decimal VerifiedCollected { get; set; }
    public decimal SuggestedBonus { get; set; } // 1% of Verified
    public int SubmissionCount { get; set; }
}

public class GetCollectionSummaryQuery : IRequest<Result<CollectionSummaryDto>>
{
    public int? BranchId { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
}

public class GetCollectionSummaryHandler : IRequestHandler<GetCollectionSummaryQuery, Result<CollectionSummaryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCollectionSummaryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CollectionSummaryDto>> Handle(GetCollectionSummaryQuery request, CancellationToken cancellationToken)
    {
        var result = new CollectionSummaryDto();

        // 1. Group by Payment Mode (from Receipts)
        var receiptQuery = _context.Receipts
            .Where(r => r.ReceiptDate.Date >= request.FromDate.Date && r.ReceiptDate.Date <= request.ToDate.Date)
            .AsQueryable();

        if (request.BranchId.HasValue)
            receiptQuery = receiptQuery.Where(r => r.BranchId == request.BranchId);

        result.Modes = await receiptQuery
            .GroupBy(r => r.PaymentMode)
            .Select(g => new PaymentModeSummaryDto
            {
                Mode = g.Key ?? "Unknown",
                TotalAmount = g.Sum(r => r.AmountReceived),
                ReceiptCount = g.Count()
            })
            .ToListAsync(cancellationToken);

        result.GrandTotal = result.Modes.Sum(m => m.TotalAmount);

        // 2. Agent Performance (from Submissions)
        var submissionQuery = _context.CollectionSubmissions
            .Include(s => s.Agent)
            .Where(s => s.SubmissionDate.Date >= request.FromDate.Date && s.SubmissionDate.Date <= request.ToDate.Date)
            .AsQueryable();

        if (request.BranchId.HasValue)
            submissionQuery = submissionQuery.Where(s => s.BranchId == request.BranchId);

        result.AgentPerformance = await submissionQuery
            .GroupBy(s => new { s.AgentId, s.Agent.FullName })
            .Select(g => new AgentPerformanceDto
            {
                AgentId = g.Key.AgentId,
                AgentName = g.Key.FullName,
                TotalCollected = g.Sum(s => s.TotalAmount),
                VerifiedCollected = g.Where(s => s.Status == "Verified").Sum(s => s.TotalAmount),
                SubmissionCount = g.Count(),
                SuggestedBonus = g.Where(s => s.Status == "Verified").Sum(s => s.TotalAmount) * 0.01m
            })
            .OrderByDescending(a => a.VerifiedCollected)
            .ToListAsync(cancellationToken);

        return Result<CollectionSummaryDto>.Success(result);
    }
}
