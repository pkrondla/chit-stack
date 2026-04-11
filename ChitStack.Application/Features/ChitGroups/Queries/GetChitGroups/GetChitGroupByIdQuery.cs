using AutoMapper;
using AutoMapper.QueryableExtensions;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.ChitGroups.Queries.GetChitGroups;

public class GetChitGroupByIdQuery : IRequest<Result<ChitGroupDto>>
{
    public int Id { get; set; }
}

public class GetChitGroupByIdHandler : IRequestHandler<GetChitGroupByIdQuery, Result<ChitGroupDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetChitGroupByIdHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<ChitGroupDto>> Handle(GetChitGroupByIdQuery request, CancellationToken cancellationToken)
    {
        var group = await _context.ChitGroups
            .Where(x => x.Id == request.Id)
            .ProjectTo<ChitGroupDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

        if (group == null)
            return Result<ChitGroupDto>.Failure("Group not found");

        return Result<ChitGroupDto>.Success(group);
    }
}
