using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Reporting.Queries.GetRegisterOfSubscribers;

public class RegisterOfSubscribersDto
{
    public int ChitGroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public int DurationMonths { get; set; }
    public List<SubscriberTicketDto> Subscribers { get; set; } = new();
}

public class SubscriberTicketDto
{
    public int TicketNumber { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public DateTime? DateOfJoining { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class GetRegisterOfSubscribersQuery : IRequest<Result<RegisterOfSubscribersDto>>
{
    public int ChitGroupId { get; set; }
}

public class GetRegisterOfSubscribersHandler : IRequestHandler<GetRegisterOfSubscribersQuery, Result<RegisterOfSubscribersDto>>
{
    private readonly IApplicationDbContext _context;

    public GetRegisterOfSubscribersHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<RegisterOfSubscribersDto>> Handle(GetRegisterOfSubscribersQuery request, CancellationToken cancellationToken)
    {
        var group = await _context.ChitGroups
            .Include(g => g.Tickets)
                .ThenInclude(t => t.Member)
            .FirstOrDefaultAsync(g => g.Id == request.ChitGroupId, cancellationToken);

        if (group == null) return Result<RegisterOfSubscribersDto>.Failure("Chit Group not found.");

        var result = new RegisterOfSubscribersDto
        {
            ChitGroupId = group.Id,
            GroupName = group.GroupName,
            ChitValue = group.ChitValue,
            DurationMonths = group.DurationMonths,
            Subscribers = group.Tickets
                .OrderBy(t => t.TicketNumber)
                .Select(t => new SubscriberTicketDto
                {
                    TicketNumber = t.TicketNumber,
                    FullName = (t.Member != null ? t.Member.FullName : (t.IsForeman ? "Foreman" : "VACANT")),
                    Address = t.Member?.Address ?? "",
                    DateOfJoining = group.LaunchDate, // For simplicity using group launch date
                    Status = t.Status.ToString()
                })
                .ToList()
        };

        return Result<RegisterOfSubscribersDto>.Success(result);
    }
}
