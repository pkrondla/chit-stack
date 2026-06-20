using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Catalog.Queries.GetComponents;

public class SoftwareComponentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string PricingType { get; set; } = string.Empty;
    public bool IsMandatory { get; set; }
    public decimal MonthlyPrice { get; set; }
    public decimal HalfYearlyPrice { get; set; }
    public decimal AnnualPrice { get; set; }
    public decimal LicensePrice { get; set; }
    public decimal DailyPrice { get; set; }   // PerDay training items (stored in HourlyPrice column)
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public class GetCatalogComponentsQuery : IRequest<Result<List<SoftwareComponentDto>>>
{
    public bool IncludeInactive { get; set; } = false;
}

public class GetCatalogComponentsHandler
    : IRequestHandler<GetCatalogComponentsQuery, Result<List<SoftwareComponentDto>>>
{
    private readonly IGlobalDbContext _context;

    public GetCatalogComponentsHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<SoftwareComponentDto>>> Handle(
        GetCatalogComponentsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.SoftwareComponents.AsNoTracking();

        if (!request.IncludeInactive)
            query = query.Where(c => c.IsActive);

        var list = await query
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new SoftwareComponentDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Category = c.Category,
                PricingType = c.PricingType,
                IsMandatory = c.IsMandatory,
                MonthlyPrice = c.MonthlyPrice,
                HalfYearlyPrice = c.HalfYearlyPrice,
                AnnualPrice = c.AnnualPrice,
                LicensePrice = c.LicensePrice,
                DailyPrice = c.HourlyPrice,   // HourlyPrice column repurposed for training day rate
                DisplayOrder = c.DisplayOrder,
                IsActive = c.IsActive
            })
            .ToListAsync(cancellationToken);

        return Result<List<SoftwareComponentDto>>.Success(list);
    }
}
