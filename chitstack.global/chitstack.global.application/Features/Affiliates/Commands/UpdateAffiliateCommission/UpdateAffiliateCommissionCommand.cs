using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Affiliates.Commands.UpdateAffiliateCommission;

public class UpdateAffiliateCommand : IRequest<Result<bool>>
{
    public int AffiliateId { get; set; }
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? CompanyName { get; set; }
    /// <summary>Null clears the override, reverting to the global default.</summary>
    public decimal? CommissionPercent { get; set; }
    public bool ClearCommissionOverride { get; set; } = false;
    public string UpdatedBy { get; set; } = string.Empty;
}

public class UpdateAffiliateHandler : IRequestHandler<UpdateAffiliateCommand, Result<bool>>
{
    private readonly IGlobalDbContext _context;

    public UpdateAffiliateHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(UpdateAffiliateCommand request, CancellationToken cancellationToken)
    {
        var affiliate = await _context.Affiliates
            .FirstOrDefaultAsync(a => a.Id == request.AffiliateId, cancellationToken);

        if (affiliate is null)
            return Result<bool>.Failure("Affiliate not found.");

        if (request.Name is not null) affiliate.Name = request.Name;
        if (request.Phone is not null) affiliate.Phone = request.Phone;
        if (request.CompanyName is not null) affiliate.CompanyName = request.CompanyName;

        if (request.ClearCommissionOverride)
            affiliate.CommissionPercent = null;
        else if (request.CommissionPercent.HasValue)
        {
            if (request.CommissionPercent.Value < 0 || request.CommissionPercent.Value > 100)
                return Result<bool>.Failure("Commission percent must be between 0 and 100.");
            affiliate.CommissionPercent = request.CommissionPercent.Value;
        }

        affiliate.LastModifiedAt = DateTime.UtcNow;
        affiliate.LastModifiedBy = request.UpdatedBy;

        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
