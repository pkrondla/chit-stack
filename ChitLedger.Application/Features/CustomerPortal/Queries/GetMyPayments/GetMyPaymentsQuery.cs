using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.CustomerPortal.Queries.GetMyPayments;

public class MemberPaymentsSummaryDto
{
    public List<MyPaymentDto> RecentPayments { get; set; } = new();
    public List<MyDemandDto> PendingDemands { get; set; } = new();
}

public class MyPaymentDto
{
    public int ReceiptId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public int InstallmentNumber { get; set; }
    public decimal Amount { get; set; }
    public DateTime ReceiptDate { get; set; }
    public string PaymentMode { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
}

public class MyDemandDto
{
    public int DemandId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public int InstallmentNumber { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public DateTime DueDate { get; set; }
}

public class GetMyPaymentsQuery : IRequest<Result<MemberPaymentsSummaryDto>>
{
}

public class GetMyPaymentsHandler : IRequestHandler<GetMyPaymentsQuery, Result<MemberPaymentsSummaryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyPaymentsHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<MemberPaymentsSummaryDto>> Handle(GetMyPaymentsQuery request, CancellationToken cancellationToken)
    {
        var memberId = _currentUserService.MemberId;
        if (memberId == null)
            return Result<MemberPaymentsSummaryDto>.Failure("User is not linked to a Member profile.");

        var ticketIds = await _context.Tickets
            .Where(t => t.MemberId == memberId)
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);

        var response = new MemberPaymentsSummaryDto();

        // 1. Get Recent Payments (Receipts)
        var receipts = await _context.Receipts
            .Include(r => r.Ticket)
            .ThenInclude(t => t.ChitGroup)
            .Include(r => r.Auction)
            .Where(r => ticketIds.Contains(r.TicketId))
            .OrderByDescending(r => r.ReceiptDate)
            .Take(20)
            .ToListAsync(cancellationToken);

        response.RecentPayments = receipts.Select(r => new MyPaymentDto
        {
            ReceiptId = r.Id,
            GroupName = r.Ticket?.ChitGroup?.GroupName ?? "Unknown Group",
            InstallmentNumber = r.Auction?.InstallmentNumber ?? 0,
            Amount = r.AmountReceived,
            ReceiptDate = r.ReceiptDate,
            PaymentMode = r.PaymentMode,
            ReferenceNumber = r.ReferenceNumber
        }).ToList();

        // 2. Get Pending Demands
        var demands = await _context.Demands
            .Include(d => d.Ticket)
            .ThenInclude(t => t.ChitGroup)
            .Include(d => d.Auction)
            .Where(d => ticketIds.Contains(d.TicketId) && d.Status != "Paid")
            .OrderBy(d => d.Auction.AuctionDate)
            .ToListAsync(cancellationToken);

        response.PendingDemands = demands.Select(d => new MyDemandDto
        {
            DemandId = d.Id,
            GroupName = d.Ticket?.ChitGroup?.GroupName ?? "Unknown Group",
            InstallmentNumber = d.Auction?.InstallmentNumber ?? 0,
            TotalAmount = d.NetAmount,
            PaidAmount = d.CollectedAmount,
            BalanceAmount = d.NetAmount - d.CollectedAmount,
            DueDate = d.Auction?.AuctionDate.AddDays(5) ?? DateTime.Now.AddDays(5) // Assuming 5 days grace period
        }).ToList();

        return Result<MemberPaymentsSummaryDto>.Success(response);
    }
}
