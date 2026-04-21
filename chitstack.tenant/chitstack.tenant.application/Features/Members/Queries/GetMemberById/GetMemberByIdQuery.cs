using AutoMapper;
using AutoMapper.QueryableExtensions;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Application.Features.Members.Queries.GetMembers;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Members.Queries.GetMemberById;

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
        var memberDto = await _context.Members
            .Include(m => m.RegistrationBranch)
            .Include(m => m.Tickets)
                .ThenInclude(t => t.ChitGroup)
            .Where(m => m.Id == request.Id)
            .ProjectTo<MemberDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

        if (memberDto == null)
        {
            return Result<MemberDto>.Failure("Member not found");
        }

        memberDto.IsPortalEnabled = await _context.Users.AnyAsync(u => u.MemberId == request.Id, cancellationToken);

        return Result<MemberDto>.Success(memberDto);
    }
}
