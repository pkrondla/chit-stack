using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Affiliates.Queries.GetAffiliates;

public class AffiliateListDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public bool IsApproved { get; set; }
    public bool IsActive { get; set; }
    public decimal? CommissionPercent { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
    public int TotalReferrals { get; set; }
    public decimal TotalCommissionAmount { get; set; }
    public decimal PendingCommissionAmount { get; set; }
}

public class GetAffiliatesQuery : IRequest<Result<List<AffiliateListDto>>>
{
    public bool? IsApproved { get; set; }
}

public class GetAffiliatesHandler : IRequestHandler<GetAffiliatesQuery, Result<List<AffiliateListDto>>>
{
    private readonly IGlobalDbContext _context;

    public GetAffiliatesHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AffiliateListDto>>> Handle(GetAffiliatesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Affiliates.AsNoTracking();

        if (request.IsApproved.HasValue)
            query = query.Where(a => a.IsApproved == request.IsApproved.Value);

        var affiliates = await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AffiliateListDto
            {
                Id = a.Id,
                Code = a.Code,
                Name = a.Name,
                Email = a.Email,
                Phone = a.Phone,
                CompanyName = a.CompanyName,
                IsApproved = a.IsApproved,
                IsActive = a.IsActive,
                CommissionPercent = a.CommissionPercent,
                CreatedAt = a.CreatedAt,
                ApprovedAt = a.ApprovedAt,
                ApprovedBy = a.ApprovedBy,
                TotalReferrals = a.Commissions.Count,
                TotalCommissionAmount = a.Commissions.Sum(c => c.CommissionAmount),
                PendingCommissionAmount = a.Commissions.Where(c => c.Status == "Pending").Sum(c => c.CommissionAmount)
            })
            .ToListAsync(cancellationToken);

        return Result<List<AffiliateListDto>>.Success(affiliates);
    }
}
