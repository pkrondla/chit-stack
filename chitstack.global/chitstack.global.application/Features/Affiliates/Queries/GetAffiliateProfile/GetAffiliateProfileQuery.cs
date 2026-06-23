using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Affiliates.Queries.GetAffiliateProfile;

public class AffiliateProfileDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public bool IsApproved { get; set; }
    public decimal? CommissionPercent { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalReferrals { get; set; }
    public decimal TotalEarned { get; set; }
    public decimal PendingAmount { get; set; }
    public decimal PaidAmount { get; set; }
}

public class GetAffiliateProfileQuery : IRequest<Result<AffiliateProfileDto>>
{
    public int AffiliateId { get; set; }
}

public class GetAffiliateProfileHandler : IRequestHandler<GetAffiliateProfileQuery, Result<AffiliateProfileDto>>
{
    private readonly IGlobalDbContext _context;

    public GetAffiliateProfileHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<AffiliateProfileDto>> Handle(GetAffiliateProfileQuery request, CancellationToken cancellationToken)
    {
        var dto = await _context.Affiliates
            .AsNoTracking()
            .Where(a => a.Id == request.AffiliateId)
            .Select(a => new AffiliateProfileDto
            {
                Id = a.Id,
                Code = a.Code,
                Name = a.Name,
                Email = a.Email,
                Phone = a.Phone,
                CompanyName = a.CompanyName,
                IsApproved = a.IsApproved,
                CommissionPercent = a.CommissionPercent,
                CreatedAt = a.CreatedAt,
                TotalReferrals = a.Commissions.Count,
                TotalEarned = a.Commissions.Sum(c => c.CommissionAmount),
                PendingAmount = a.Commissions.Where(c => c.Status == "Pending").Sum(c => c.CommissionAmount),
                PaidAmount = a.Commissions.Where(c => c.Status == "Paid").Sum(c => c.CommissionAmount)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (dto is null)
            return Result<AffiliateProfileDto>.Failure("Affiliate not found.");

        return Result<AffiliateProfileDto>.Success(dto);
    }
}
