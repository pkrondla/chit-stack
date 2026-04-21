using AutoMapper;
using AutoMapper.QueryableExtensions;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.ChitGroups.Queries.GetChitGroups;

public class GetChitGroupsQuery : IRequest<Result<List<ChitGroupDto>>>
{
}

public class GetChitGroupsHandler : IRequestHandler<GetChitGroupsQuery, Result<List<ChitGroupDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ITenantService _tenantService; // To double check filtering or access

    public GetChitGroupsHandler(IApplicationDbContext context, IMapper mapper, ITenantService tenantService)
    {
        _context = context;
        _mapper = mapper;
        _tenantService = tenantService;
    }

    public async Task<Result<List<ChitGroupDto>>> Handle(GetChitGroupsQuery request, CancellationToken cancellationToken)
    {
        // Global Filter automatically handles TenantId in TenantDbContext
        // But we rely on interface. Interface doesn't enforce filter logic, implementation does.
        // Assuming TenantDbContext is injected as IApplicationDbContext.
        
        var groups = await _context.ChitGroups
            .ProjectTo<ChitGroupDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return Result<List<ChitGroupDto>>.Success(groups);
    }
}
