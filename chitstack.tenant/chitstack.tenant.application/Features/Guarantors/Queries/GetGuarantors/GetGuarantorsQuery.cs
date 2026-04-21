using AutoMapper;
using AutoMapper.QueryableExtensions;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Guarantors.Queries.GetGuarantors;

public class GuarantorDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public string Occupation { get; set; } = string.Empty;
    public decimal AnnualIncome { get; set; }
}

public class GetGuarantorsQuery : IRequest<Result<List<GuarantorDto>>>
{
    public int TicketId { get; set; }
}

public class GetGuarantorsHandler : IRequestHandler<GetGuarantorsQuery, Result<List<GuarantorDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetGuarantorsHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<GuarantorDto>>> Handle(GetGuarantorsQuery request, CancellationToken cancellationToken)
    {
        var guarantors = await _context.Guarantors
            .Where(g => g.TicketId == request.TicketId)
            .ProjectTo<GuarantorDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return Result<List<GuarantorDto>>.Success(guarantors);
    }
}

public class GuarantorProfile : Profile
{
    public GuarantorProfile()
    {
        CreateMap<Guarantor, GuarantorDto>();
    }
}
