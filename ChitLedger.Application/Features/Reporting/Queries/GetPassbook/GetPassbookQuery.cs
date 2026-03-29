using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Reporting.Queries.GetPassbook;

public class PassbookDto
{
    public int TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public string MemberName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public int Duration { get; set; }
    
    public decimal TotalPaid { get; set; }
    public decimal TotalDue { get; set; }
    public decimal AdvanceBalance { get; set; }
    
    public List<PassbookEntryDto> Entries { get; set; } = new();
}

public class PassbookEntryDto
{
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal InstallmentAmount { get; set; }
    public decimal Dividend { get; set; }
    public decimal Penalty { get; set; }
    public decimal Credit { get; set; }
    public decimal Balance { get; set; }
    public string Status { get; set; } = "Confirmed"; // Confirmed, Pending
    public string Reference { get; set; } = string.Empty;
}

public class GetPassbookQuery : IRequest<Result<PassbookDto>>
{
    public int TicketId { get; set; }
}

public class GetPassbookHandler : IRequestHandler<GetPassbookQuery, Result<PassbookDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPassbookHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PassbookDto>> Handle(GetPassbookQuery request, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Member)
            .Include(t => t.ChitGroup)
            .Include(t => t.Demands)
            .Include(t => t.Receipts)
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket == null) return Result<PassbookDto>.Failure("Ticket not found.");

        var passbook = new PassbookDto
        {
            TicketId = ticket.Id,
            TicketNumber = ticket.TicketNumber.ToString(),
            GroupName = ticket.ChitGroup.GroupName,
            MemberName = ticket.Member != null ? ticket.Member.FullName : "Vacant",
            ChitValue = ticket.ChitGroup.ChitValue,
            Duration = ticket.ChitGroup.DurationMonths,
            AdvanceBalance = ticket.AdvanceBalance
        };

        // Combine Demands and Receipts into chronological entries
        var entries = new List<PassbookEntryDto>();

        // 1. Add Installment Demands
        foreach (var demand in ticket.Demands)
        {
            var calc = ChitLedger.Application.Common.Helpers.PenaltyCalculator.Calculate(demand, ticket.ChitGroup);
            entries.Add(new PassbookEntryDto
            {
                Date = demand.DueDate,
                Description = $"Installment #{demand.InstallmentNumber}",
                InstallmentAmount = demand.GrossAmount, // Standard installment value
                Dividend = demand.DividendAmount,
                Penalty = calc.EffectivePenalty,
                Credit = 0,
                Status = "Confirmed"
            });
        }

        // 2. Add Receipts
        foreach (var receipt in ticket.Receipts)
        {
            entries.Add(new PassbookEntryDto
            {
                Date = receipt.ReceiptDate,
                Description = "Payment Received",
                Credit = receipt.AmountReceived,
                Status = receipt.Status == "Pending" ? "Pending" : "Confirmed",
                Reference = $"Receipt #{receipt.Id} ({receipt.PaymentMode})"
            });
        }

        passbook.Entries = entries.OrderBy(e => e.Date).ThenBy(e => e.Credit > 0).ToList();

        // Calculate Running Balance
        decimal runningBalance = 0;
        foreach (var entry in passbook.Entries)
        {
            if (entry.InstallmentAmount > 0)
            {
                runningBalance += (entry.InstallmentAmount - entry.Dividend + entry.Penalty);
            }
            if (entry.Credit > 0)
            {
                runningBalance -= entry.Credit;
            }
            entry.Balance = runningBalance;
        }

        passbook.TotalPaid = ticket.Receipts.Where(r => r.Status != "Cancelled").Sum(r => r.AmountReceived);
        passbook.TotalDue = runningBalance;

        return Result<PassbookDto>.Success(passbook);
    }
}
