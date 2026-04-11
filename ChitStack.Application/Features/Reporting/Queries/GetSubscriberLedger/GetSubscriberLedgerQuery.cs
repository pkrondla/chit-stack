using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Reporting.Queries.GetSubscriberLedger;

public class SubscriberLedgerDto
{
    public int TicketNumber { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public List<LedgerEntryDto> Entries { get; set; } = new();
}

public class LedgerEntryDto
{
    public int InstallmentNumber { get; set; }
    public DateTime AuctionDate { get; set; }
    public decimal GrossInstallment { get; set; }
    public decimal DividendEarned { get; set; }
    public decimal NetPayable { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal PenaltyPaid { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? PaymentDate { get; set; }
}

public class GetSubscriberLedgerQuery : IRequest<Result<SubscriberLedgerDto>>
{
    public int TicketId { get; set; }
}

public class GetSubscriberLedgerHandler : IRequestHandler<GetSubscriberLedgerQuery, Result<SubscriberLedgerDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSubscriberLedgerHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<SubscriberLedgerDto>> Handle(GetSubscriberLedgerQuery request, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Member)
            .Include(t => t.ChitGroup)
            .Include(t => t.Demands)
                .ThenInclude(d => d.Auction)
            .Include(t => t.Receipts)
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket == null) return Result<SubscriberLedgerDto>.Failure("Ticket not found.");

        var result = new SubscriberLedgerDto
        {
            TicketNumber = ticket.TicketNumber,
            MemberName = ticket.Member?.FullName ?? "Unknown",
            GroupName = ticket.ChitGroup.GroupName,
            ChitValue = ticket.ChitGroup.ChitValue,
            Entries = ticket.Demands
                .OrderBy(d => d.InstallmentNumber)
                .Select(d => new LedgerEntryDto
                {
                    InstallmentNumber = d.InstallmentNumber,
                    AuctionDate = d.Auction.AuctionDate,
                    GrossInstallment = d.GrossAmount,
                    DividendEarned = d.DividendAmount,
                    NetPayable = d.NetAmount,
                    AmountPaid = d.CollectedAmount,
                    PenaltyPaid = d.PenaltyAmount,
                    Status = d.Status,
                    PaymentDate = ticket.Receipts
                        .Where(r => r.AuctionId == d.AuctionId && r.Status == "Verified")
                        .OrderByDescending(r => r.ReceiptDate)
                        .Select(r => (DateTime?)r.ReceiptDate)
                        .FirstOrDefault()
                })
                .ToList()
        };

        return Result<SubscriberLedgerDto>.Success(result);
    }
}
