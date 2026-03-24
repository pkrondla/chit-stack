using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Collections.Queries.GetRouteMembers;

public class RouteMemberDto
{
    public int MemberId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Address { get; set; }
    public decimal TotalOutstanding { get; set; }
    public int OverdueDays { get; set; }
    public int TicketCount { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
}

public class GetRouteMembersQuery : IRequest<Result<List<RouteMemberDto>>>
{
    public int? RouteId { get; set; }
}

public class GetRouteMembersHandler : IRequestHandler<GetRouteMembersQuery, Result<List<RouteMemberDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetRouteMembersHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<RouteMemberDto>>> Handle(GetRouteMembersQuery request, CancellationToken cancellationToken)
    {
        int? routeId = request.RouteId;

        // If no RouteId provided, try to get assigned route for current user
        if (routeId == null)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id.ToString() == _currentUserService.UserId, cancellationToken);
            if (user != null)
            {
                routeId = user.AssignedRouteId;
            }
        }

        if (routeId == null)
        {
            return Result<List<RouteMemberDto>>.Failure("No route assigned or specified.");
        }

        var members = await _context.Members
            .Where(m => m.CollectionRouteId == routeId)
            .Include(m => m.Tickets)
                .ThenInclude(t => t.Demands)
            .ToListAsync(cancellationToken);

        var result = members.Select(m => {
            var outstandingDemands = m.Tickets.SelectMany(t => t.Demands)
                .Where(d => d.Status != "Paid")
                .ToList();

            var totalDue = outstandingDemands.Sum(d => (d.NetAmount + d.PenaltyAmount) - d.CollectedAmount);
            var maxOverdueDays = outstandingDemands.Any() 
                ? outstandingDemands.Max(d => (DateTime.Now.Date - d.DueDate.Date).Days)
                : 0;

            return new RouteMemberDto
            {
                MemberId = m.Id,
                FullName = m.FullName,
                PhoneNumber = m.PhoneNumber,
                Address = m.Address,
                TotalOutstanding = totalDue,
                OverdueDays = Math.Max(0, maxOverdueDays),
                TicketCount = m.Tickets.Count,
                Latitude = m.Latitude ?? 0,
                Longitude = m.Longitude ?? 0
            };
        })
        .OrderByDescending(m => m.TotalOutstanding)
        .ToList();

        return Result<List<RouteMemberDto>>.Success(result);
    }
}
