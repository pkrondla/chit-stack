using AutoMapper;
using AutoMapper.QueryableExtensions;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Application.Features.Members.Queries.GetMembers;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Members.Queries.GetMemberById;

public class GetMemberByIdQuery : IRequest<Result<MemberDto>>
{
    public int Id { get; set; }
}

public class GetMemberByIdHandler : IRequestHandler<GetMemberByIdQuery, Result<MemberDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetMemberByIdHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<MemberDto>> Handle(GetMemberByIdQuery request, CancellationToken cancellationToken)
    {
        var member = await _context.Members
            .Include(m => m.Tickets)
                .ThenInclude(t => t.ChitGroup)
            .Where(m => m.Id == request.Id)
            .ProjectTo<MemberDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

        if (member == null)
        {
            return Result<MemberDto>.Failure("Member not found");
        }

        return Result<MemberDto>.Success(member);
    }
}
