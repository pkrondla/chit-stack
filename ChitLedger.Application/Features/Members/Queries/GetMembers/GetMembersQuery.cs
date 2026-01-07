using AutoMapper;
using AutoMapper.QueryableExtensions;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Members.Queries.GetMembers;

public class GetMembersQuery : IRequest<Result<List<MemberDto>>>
{
}

public class GetMembersHandler : IRequestHandler<GetMembersQuery, Result<List<MemberDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetMembersHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<MemberDto>>> Handle(GetMembersQuery request, CancellationToken cancellationToken)
    {
        var members = await _context.Members
            .Include(m => m.Tickets)
            .ProjectTo<MemberDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return Result<List<MemberDto>>.Success(members);
    }
}
