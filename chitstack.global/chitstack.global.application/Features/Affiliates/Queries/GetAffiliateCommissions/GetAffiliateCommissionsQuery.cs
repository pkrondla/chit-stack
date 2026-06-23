using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Affiliates.Queries.GetAffiliateCommissions;

public class AffiliateCommissionDto
{
    public int Id { get; set; }
    public int AffiliateId { get; set; }
    public string AffiliateName { get; set; } = string.Empty;
    public string AffiliateCode { get; set; } = string.Empty;
    public int TenantOrderId { get; set; }
    public string OrderReference { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public decimal OrderAmount { get; set; }
    public decimal CommissionPercent { get; set; }
    public decimal CommissionAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public int? PayoutId { get; set; }
}

public class GetAffiliateCommissionsQuery : IRequest<Result<List<AffiliateCommissionDto>>>
{
    /// <summary>Null = admin view (all affiliates). Set for affiliate self-view.</summary>
    public int? AffiliateId { get; set; }
    public string? Status { get; set; }
}

public class GetAffiliateCommissionsHandler : IRequestHandler<GetAffiliateCommissionsQuery, Result<List<AffiliateCommissionDto>>>
{
    private readonly IGlobalDbContext _context;

    public GetAffiliateCommissionsHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AffiliateCommissionDto>>> Handle(GetAffiliateCommissionsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.AffiliateCommissions
            .AsNoTracking()
            .Include(c => c.Affiliate)
            .Include(c => c.TenantOrder)
            .AsQueryable();

        if (request.AffiliateId.HasValue)
            query = query.Where(c => c.AffiliateId == request.AffiliateId.Value);

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(c => c.Status == request.Status);

        var result = await query
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new AffiliateCommissionDto
            {
                Id = c.Id,
                AffiliateId = c.AffiliateId,
                AffiliateName = c.Affiliate!.Name,
                AffiliateCode = c.Affiliate!.Code,
                TenantOrderId = c.TenantOrderId,
                OrderReference = c.TenantOrder!.OrderReference,
                CompanyName = c.TenantOrder!.CompanyName,
                OrderAmount = c.OrderAmount,
                CommissionPercent = c.CommissionPercent,
                CommissionAmount = c.CommissionAmount,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                PaidAt = c.PaidAt,
                PayoutId = c.PayoutId
            })
            .ToListAsync(cancellationToken);

        return Result<List<AffiliateCommissionDto>>.Success(result);
    }
}
