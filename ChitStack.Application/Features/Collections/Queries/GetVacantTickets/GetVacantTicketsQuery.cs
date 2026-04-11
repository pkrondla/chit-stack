using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Collections.Queries.GetVacantTickets;

public class VacantTicketDto
{
    public int TicketId { get; set; }
    public int TicketNumber { get; set; }
    public int GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public int Duration { get; set; }
    public decimal MonthlyInstallment { get; set; }
}

public class GetVacantTicketsQuery : IRequest<Result<List<VacantTicketDto>>>
{
}

public class GetVacantTicketsHandler : IRequestHandler<GetVacantTicketsQuery, Result<List<VacantTicketDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetVacantTicketsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<VacantTicketDto>>> Handle(GetVacantTicketsQuery request, CancellationToken cancellationToken)
    {
        var tickets = await _context.Tickets
            .Include(t => t.ChitGroup)
            .Where(t => t.MemberId == null && (t.ChitGroup.Status == GroupStatus.Proposed || t.ChitGroup.Status == GroupStatus.Active))
            .OrderBy(t => t.ChitGroup.LaunchDate)
            .ToListAsync(cancellationToken);

        var result = tickets.Select(t => new VacantTicketDto
        {
            TicketId = t.Id,
            TicketNumber = t.TicketNumber,
            GroupId = t.ChitGroup.Id,
            GroupName = t.ChitGroup.GroupName,
            ChitValue = t.ChitGroup.ChitValue,
            Duration = t.ChitGroup.DurationMonths,
            MonthlyInstallment = t.ChitGroup.InstallmentAmount
        }).ToList();

        return Result<List<VacantTicketDto>>.Success(result);
    }
}
