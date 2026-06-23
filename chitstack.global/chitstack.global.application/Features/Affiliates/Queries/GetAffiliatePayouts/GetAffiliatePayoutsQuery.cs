using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Affiliates.Queries.GetAffiliatePayouts;

public class AffiliatePayoutDto
{
    public int Id { get; set; }
    public int AffiliateId { get; set; }
    public string AffiliateName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? PaymentReference { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int CommissionsLinked { get; set; }
}

public class GetAffiliatePayoutsQuery : IRequest<Result<List<AffiliatePayoutDto>>>
{
    public int? AffiliateId { get; set; }
}

public class GetAffiliatePayoutsHandler : IRequestHandler<GetAffiliatePayoutsQuery, Result<List<AffiliatePayoutDto>>>
{
    private readonly IGlobalDbContext _context;

    public GetAffiliatePayoutsHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AffiliatePayoutDto>>> Handle(GetAffiliatePayoutsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.AffiliatePayouts
            .AsNoTracking()
            .Include(p => p.Affiliate)
            .Include(p => p.Commissions)
            .AsQueryable();

        if (request.AffiliateId.HasValue)
            query = query.Where(p => p.AffiliateId == request.AffiliateId.Value);

        var result = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new AffiliatePayoutDto
            {
                Id = p.Id,
                AffiliateId = p.AffiliateId,
                AffiliateName = p.Affiliate!.Name,
                Amount = p.Amount,
                PaymentMethod = p.PaymentMethod,
                PaymentReference = p.PaymentReference,
                Notes = p.Notes,
                Status = p.Status,
                CreatedAt = p.CreatedAt,
                CommissionsLinked = p.Commissions.Count
            })
            .ToListAsync(cancellationToken);

        return Result<List<AffiliatePayoutDto>>.Success(result);
    }
}
