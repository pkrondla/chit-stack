using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Orders.Commands.UpdateOrderAffiliate;

public class UpdateOrderAffiliateCommand : IRequest<Result<bool>>
{
    public string OrderReference { get; set; } = string.Empty;
    /// <summary>Affiliate code to link. Null or empty to remove the affiliate from the order.</summary>
    public string? AffiliateCode { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
}

public class UpdateOrderAffiliateHandler : IRequestHandler<UpdateOrderAffiliateCommand, Result<bool>>
{
    private readonly IGlobalDbContext _context;

    public UpdateOrderAffiliateHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(UpdateOrderAffiliateCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.TenantOrders
            .FirstOrDefaultAsync(o => o.OrderReference == request.OrderReference, cancellationToken);

        if (order is null)
            return Result<bool>.Failure("Order not found.");

        if (string.IsNullOrWhiteSpace(request.AffiliateCode))
        {
            // Remove affiliate linkage
            order.AffiliateId = null;
            order.LastModifiedAt = DateTime.UtcNow;
            order.LastModifiedBy = request.UpdatedBy;
            await _context.SaveChangesAsync(cancellationToken);
            return Result<bool>.Success(true);
        }

        var affiliate = await _context.Affiliates
            .FirstOrDefaultAsync(a => a.Code == request.AffiliateCode && a.IsApproved && a.IsActive, cancellationToken);

        if (affiliate is null)
            return Result<bool>.Failure($"No active approved affiliate found with code '{request.AffiliateCode}'.");

        order.AffiliateId = affiliate.Id;
        order.LastModifiedAt = DateTime.UtcNow;
        order.LastModifiedBy = request.UpdatedBy;

        // Also link affiliate to the tenant if not already linked
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == order.TenantId, cancellationToken);
        if (tenant is not null && tenant.AffiliateId is null)
            tenant.AffiliateId = affiliate.Id;

        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
