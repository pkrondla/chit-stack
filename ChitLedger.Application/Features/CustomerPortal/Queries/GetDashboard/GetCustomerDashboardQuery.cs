using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.CustomerPortal.Queries.GetDashboard;

public class CustomerDashboardDto
{
    public decimal TotalLiability { get; set; } // Pending Demands
    public decimal TotalSavings { get; set; } // Total Dividends earned
    public List<MyTicketDto> MyTickets { get; set; } = new();
    public List<DashboardAuctionDto> UpcomingAuctions { get; set; } = new();
}

public class MyTicketDto
{
    public int TicketId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public int TicketNumber { get; set; }
    public bool IsPrized { get; set; }
}

public class DashboardAuctionDto
{
    public int AuctionId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int Installment { get; set; }
}

public class GetCustomerDashboardQuery : IRequest<Result<CustomerDashboardDto>>
{
}

public class GetCustomerDashboardHandler : IRequestHandler<GetCustomerDashboardQuery, Result<CustomerDashboardDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetCustomerDashboardHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<CustomerDashboardDto>> Handle(GetCustomerDashboardQuery request, CancellationToken cancellationToken)
    {
        var memberId = _currentUserService.MemberId;
        if (memberId == null)
        {
            return Result<CustomerDashboardDto>.Failure("User is not linked to a Member profile.");
        }

        var dashboard = new CustomerDashboardDto();

        // 1. Get Tickets
        var tickets = await _context.Tickets
            .Include(t => t.ChitGroup)
            .Where(t => t.MemberId == memberId)
            .ToListAsync(cancellationToken);

        dashboard.MyTickets = tickets.Select(t => new MyTicketDto
        {
            TicketId = t.Id,
            GroupName = t.ChitGroup.GroupName,
            ChitValue = t.ChitGroup.ChitValue,
            TicketNumber = t.TicketNumber,
            IsPrized = t.IsPrized
        }).ToList();

        var ticketIds = tickets.Select(t => t.Id).ToList();
        var groupIds = tickets.Select(t => t.ChitGroupId).Distinct().ToList();

        // 2. Calculate Liability (Pending Demands)
        var demands = await _context.Demands
            .Where(d => ticketIds.Contains(d.TicketId))
            .ToListAsync(cancellationToken);
            
        dashboard.TotalLiability = demands.Where(d => d.Status != "Paid").Sum(d => d.NetAmount - d.CollectedAmount);
        dashboard.TotalSavings = demands.Sum(d => d.DividendAmount);

        // 3. Upcoming Auctions
        var auctions = await _context.Auctions
            .Include(a => a.ChitGroup)
            .Where(a => groupIds.Contains(a.ChitGroupId) && a.AuctionDate >= DateTime.Now)
            .OrderBy(a => a.AuctionDate)
            .Take(5)
            .ToListAsync(cancellationToken);

        dashboard.UpcomingAuctions = auctions.Select(a => new DashboardAuctionDto
        {
            AuctionId = a.Id,
            GroupName = a.ChitGroup.GroupName,
            Date = a.AuctionDate,
            Installment = a.InstallmentNumber
        }).ToList();

        return Result<CustomerDashboardDto>.Success(dashboard);
    }
}
