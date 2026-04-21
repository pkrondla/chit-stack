using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ChitStack.Domain.Entities;

namespace ChitStack.Application.Features.Reporting.Queries.GetArrearsReport;

public class ArrearsReportDto
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public int TicketNumber { get; set; }
    public int TotalPendingInstallments { get; set; }
    public decimal TotalNetAmount { get; set; }
    public decimal TotalPenalty { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal TotalBalance { get; set; }
    public DateTime? MaxDueDate { get; set; }
    public string RouteName { get; set; } = string.Empty;
}

public class GetArrearsReportQuery : IRequest<Result<List<ArrearsReportDto>>>
{
    public int? BranchId { get; set; }
    public int? ChitGroupId { get; set; }
    public int? MemberId { get; set; }
    public int? RouteId { get; set; }
}

public class GetArrearsReportHandler : IRequestHandler<GetArrearsReportQuery, Result<List<ArrearsReportDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetArrearsReportHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ArrearsReportDto>>> Handle(GetArrearsReportQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Demands
            .Include(d => d.Ticket)
                .ThenInclude(t => t.Member)
                    .ThenInclude(m => m != null ? m.CollectionRoute : null)
            .Include(d => d.Ticket)
                .ThenInclude(t => t.ChitGroup)
            .Where(d => d.Status != "Paid")
            .AsQueryable();

        if (request.BranchId.HasValue)
            query = query.Where(d => d.BranchId == request.BranchId);

        if (request.ChitGroupId.HasValue)
            query = query.Where(d => d.Ticket.ChitGroupId == request.ChitGroupId);

        if (request.MemberId.HasValue)
            query = query.Where(d => d.Ticket.MemberId == request.MemberId);

        if (request.RouteId.HasValue)
            query = query.Where(d => d.Ticket.Member != null && d.Ticket.Member.CollectionRouteId == request.RouteId);

        var demands = await query
            .Select(d => new
            {
                d.Ticket.MemberId,
                MemberFullName = d.Ticket.Member != null ? d.Ticket.Member.FullName : null,
                MemberPhone = d.Ticket.Member != null ? d.Ticket.Member.PhoneNumber : "N/A",
                d.Ticket.ChitGroup.GroupName,
                d.Ticket.TicketNumber,
                d.Ticket.IsForeman,
                d.Ticket.Status,
                RouteName = d.Ticket.Member != null && d.Ticket.Member.CollectionRoute != null ? d.Ticket.Member.CollectionRoute.RouteName : "No Route",
                d.NetAmount,
                d.PenaltyAmount,
                d.CollectedAmount,
                d.DueDate
            })
            .ToListAsync(cancellationToken);

        var arrears = demands
            .GroupBy(d => new { 
                d.MemberId, 
                d.GroupName, 
                d.TicketNumber 
            })
            .Select(g => new ArrearsReportDto
            {
                MemberId = g.Key.MemberId ?? 0,
                MemberName = g.First().IsForeman ? "FOREMAN / COMPANY" : 
                             (g.First().MemberFullName ?? (g.First().Status == TicketStatus.Vacant ? "Vacant Ticket" : "Removed Subscriber Ticket")),
                PhoneNumber = g.First().MemberPhone,
                GroupName = g.Key.GroupName,
                TicketNumber = g.Key.TicketNumber,
                TotalPendingInstallments = g.Count(),
                TotalNetAmount = g.Sum(d => d.NetAmount),
                TotalPenalty = g.Sum(d => d.PenaltyAmount),
                TotalCollected = g.Sum(d => d.CollectedAmount),
                TotalBalance = g.Sum(d => d.NetAmount + d.PenaltyAmount - d.CollectedAmount),
                MaxDueDate = g.Max(d => d.DueDate),
                RouteName = g.First().RouteName
            })
            .OrderByDescending(r => r.TotalBalance)
            .ToList();

        return Result<List<ArrearsReportDto>>.Success(arrears);
    }
}
