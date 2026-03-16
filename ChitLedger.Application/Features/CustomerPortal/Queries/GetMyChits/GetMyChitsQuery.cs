using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.CustomerPortal.Queries.GetMyChits;

public class MyChitDetailsDto
{
    public int TicketId { get; set; }
    public int GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string GroupCode { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public int Duration { get; set; }
    public int TicketNumber { get; set; }
    public bool IsPrized { get; set; }
    public int CurrentInstallment { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal BalanceToPay { get; set; }
}

public class GetMyChitsQuery : IRequest<Result<List<MyChitDetailsDto>>>
{
}

public class GetMyChitsHandler : IRequestHandler<GetMyChitsQuery, Result<List<MyChitDetailsDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyChitsHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<MyChitDetailsDto>>> Handle(GetMyChitsQuery request, CancellationToken cancellationToken)
    {
        var memberId = _currentUserService.MemberId;
        if (memberId == null)
            return Result<List<MyChitDetailsDto>>.Failure("User is not linked to a Member profile.");

        var tickets = await _context.Tickets
            .Include(t => t.ChitGroup)
            .Where(t => t.MemberId == memberId)
            .ToListAsync(cancellationToken);

        var ticketIds = tickets.Select(t => t.Id).ToList();

        var demands = await _context.Demands
            .Where(d => ticketIds.Contains(d.TicketId))
            .ToListAsync(cancellationToken);

        var response = tickets.Select(t => {
            var myDemands = demands.Where(d => d.TicketId == t.Id).ToList();
            return new MyChitDetailsDto
            {
                TicketId = t.Id,
                GroupId = t.ChitGroupId,
                GroupName = t.ChitGroup?.GroupName ?? "Unknown Group",
                GroupCode = t.ChitGroup?.SanctionNumber ?? "",
                ChitValue = t.ChitGroup?.ChitValue ?? 0,
                Duration = t.ChitGroup?.DurationMonths ?? 0,
                TicketNumber = t.TicketNumber,
                IsPrized = t.IsPrized,
                CurrentInstallment = 0,
                TotalPaid = myDemands.Sum(d => d.CollectedAmount),
                BalanceToPay = myDemands.Sum(d => d.NetAmount - d.CollectedAmount)
            };
        }).ToList();

        return Result<List<MyChitDetailsDto>>.Success(response);
    }
}
