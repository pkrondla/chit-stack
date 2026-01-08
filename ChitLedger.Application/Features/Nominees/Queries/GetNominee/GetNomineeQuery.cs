using AutoMapper;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Nominees.Queries.GetNominee;

public class NomineeDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? AadhaarNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string? GuardianName { get; set; }
}

public class GetNomineeQuery : IRequest<Result<NomineeDto?>>
{
    public int TicketId { get; set; }
}

public class GetNomineeHandler : IRequestHandler<GetNomineeQuery, Result<NomineeDto?>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetNomineeHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<NomineeDto?>> Handle(GetNomineeQuery request, CancellationToken cancellationToken)
    {
        var nominee = await _context.Nominees
            .Where(n => n.TicketId == request.TicketId)
            // Manual mapping or AutoMapper
            .Select(n => new NomineeDto
            {
                Id = n.Id,
                FullName = n.FullName,
                Relationship = n.Relationship,
                DateOfBirth = n.DateOfBirth,
                AadhaarNumber = n.AadhaarNumber,
                PhoneNumber = n.PhoneNumber,
                GuardianName = n.GuardianName
            })
            .FirstOrDefaultAsync(cancellationToken);

        return Result<NomineeDto?>.Success(nominee);
    }
}
