using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Global;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Catalog.Commands.UpsertComponent;

public class UpsertCatalogComponentCommand : IRequest<Result<int>>
{
    public int? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string PricingType { get; set; } = string.Empty;
    public bool IsMandatory { get; set; }
    public decimal MonthlyPrice { get; set; }
    public decimal HalfYearlyPrice { get; set; }
    public decimal AnnualPrice { get; set; }
    public decimal LicensePrice { get; set; }
    public decimal HourlyPrice { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpsertCatalogComponentHandler
    : IRequestHandler<UpsertCatalogComponentCommand, Result<int>>
{
    private readonly IGlobalDbContext _context;

    public UpsertCatalogComponentHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(
        UpsertCatalogComponentCommand request,
        CancellationToken cancellationToken)
    {
        SoftwareComponent component;

        if (request.Id.HasValue && request.Id.Value > 0)
        {
            component = await _context.SoftwareComponents
                .FirstOrDefaultAsync(c => c.Id == request.Id.Value, cancellationToken)
                ?? throw new InvalidOperationException($"Component {request.Id} not found.");

            component.LastModifiedAt = DateTime.UtcNow; // from BaseEntity
        }
        else
        {
            component = new SoftwareComponent { CreatedBy = "Admin" };
            _context.SoftwareComponents.Add(component);
        }

        component.Name = request.Name;
        component.Description = request.Description;
        component.Category = request.Category;
        component.PricingType = request.PricingType;
        component.IsMandatory = request.IsMandatory;
        component.MonthlyPrice = request.MonthlyPrice;
        component.HalfYearlyPrice = request.HalfYearlyPrice;
        component.AnnualPrice = request.AnnualPrice;
        component.LicensePrice = request.LicensePrice;
        component.HourlyPrice = request.HourlyPrice;
        component.DisplayOrder = request.DisplayOrder;
        component.IsActive = request.IsActive;

        await _context.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(component.Id);
    }
}
