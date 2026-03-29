using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.CustomerPortal.Queries.GetDashboard;

public class CustomerDashboardDto
{
    public decimal TotalLiability { get; set; } // Pending Demands + Penalties
    public decimal TotalSavings { get; set; } // Total Dividends earned
    public decimal TotalPenalty { get; set; } // Current Real-time Penalty
    public string AccountStatus { get; set; } = "Healthy";
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
    public string Status { get; set; } = string.Empty;
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
        Console.WriteLine($"[DEBUG] Dashboard for MemberId: {memberId}");
        var dashboard = new CustomerDashboardDto();

        // 1. Get Tickets
        var tickets = await _context.Tickets
            .Include(t => t.ChitGroup)
            .Where(t => t.MemberId == memberId)
            .ToListAsync(cancellationToken);
        
        Console.WriteLine($"[DEBUG] Tickets found: {tickets.Count}");

        dashboard.MyTickets = tickets.Select(t => new MyTicketDto
        {
            TicketId = t.Id,
            GroupName = t.ChitGroup?.GroupName ?? "Unknown Group",
            ChitValue = t.ChitGroup?.ChitValue ?? 0,
            TicketNumber = t.TicketNumber,
            IsPrized = t.IsPrized
        }).ToList();

        var ticketIds = tickets.Select(t => t.Id).ToList();
        var groupIds = tickets.Select(t => t.ChitGroupId).Distinct().ToList();

        // 2. Calculate Liability (Pending Demands with real-time penalties)
        var demands = await _context.Demands
            .Where(d => ticketIds.Contains(d.TicketId))
            .ToListAsync(cancellationToken);
            
        decimal totalLiability = 0;
        decimal totalPenalty = 0;
        bool isOverdue = false;

        foreach (var t in tickets)
        {
            var myDemands = demands.Where(d => d.TicketId == t.Id && d.Status != "Paid");
            foreach (var d in myDemands)
            {
                var calc = ChitLedger.Application.Common.Helpers.PenaltyCalculator.Calculate(d, t.ChitGroup!);
                totalLiability += calc.TotalOutstanding;
                totalPenalty += calc.EffectivePenalty;
                if (calc.OverdueDays > 0) isOverdue = true;
            }
        }
        
        dashboard.TotalLiability = totalLiability;
        dashboard.TotalPenalty = totalPenalty;
        dashboard.AccountStatus = isOverdue ? "⚠️ Overdue" : (totalPenalty > 0 ? "Penalty Accrued" : (totalLiability > 0 ? "Pending Dues" : "Healthy"));
        dashboard.TotalSavings = demands.Sum(d => d.DividendAmount);

        // 3. Upcoming Auctions
        var now = DateTime.Now;
        var auctions = await _context.Auctions
            .Include(a => a.ChitGroup)
            .Where(a => groupIds.Contains(a.ChitGroupId) && a.AuctionDate >= now)
            .OrderBy(a => a.AuctionDate)
            .Take(5)
            .ToListAsync(cancellationToken);

        Console.WriteLine($"[DEBUG] Auctions found: {auctions.Count}");

        dashboard.UpcomingAuctions = auctions.Select(a => new DashboardAuctionDto
        {
            AuctionId = a.Id,
            GroupName = a.ChitGroup?.GroupName ?? "Unknown Group",
            Date = a.AuctionDate,
            Installment = a.InstallmentNumber,
            Status = a.AuctionStatus
        }).ToList();

        return Result<CustomerDashboardDto>.Success(dashboard);
    }
}
