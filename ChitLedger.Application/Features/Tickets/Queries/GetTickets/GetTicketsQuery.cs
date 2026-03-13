using AutoMapper;
using AutoMapper.QueryableExtensions;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Tickets.Queries.GetTickets;

public class TicketDto
{
    public int Id { get; set; }
    public int TicketNumber { get; set; }
    public int? MemberId { get; set; }
    public string? MemberName { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsPrized { get; set; }
    public bool IsForeman { get; set; }
}

public class GetTicketsQuery : IRequest<Result<List<TicketDto>>>
{
    public int ChitGroupId { get; set; }
}

public class GetTicketsHandler : IRequestHandler<GetTicketsQuery, Result<List<TicketDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetTicketsHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<TicketDto>>> Handle(GetTicketsQuery request, CancellationToken cancellationToken)
    {
        var tickets = await _context.Tickets
            .IgnoreQueryFilters()
            .Include(t => t.Member)
            .Where(t => t.ChitGroupId == request.ChitGroupId)
            .OrderBy(t => t.TicketNumber)
            .ProjectTo<TicketDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return Result<List<TicketDto>>.Success(tickets);
    }
}

public class TicketProfile : Profile
{
    public TicketProfile()
    {
        CreateMap<Ticket, TicketDto>()
            .ForMember(d => d.MemberName, opt => opt.MapFrom(s => s.IsForeman ? "FOREMAN / COMPANY" : (s.Member != null ? s.Member.FullName : null)))
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()));
    }
}
