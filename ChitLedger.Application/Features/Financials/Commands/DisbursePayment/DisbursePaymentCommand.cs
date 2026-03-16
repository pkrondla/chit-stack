using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Financials.Commands.DisbursePayment;

public class DisbursePaymentCommand : IRequest<Result<int>>
{
    public int AuctionId { get; set; }
    public string PaymentMode { get; set; } = "Bank";
    public string ReferenceNumber { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; } = DateTime.Now;
}

public class DisbursePaymentHandler : IRequestHandler<DisbursePaymentCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJournalService _journalService;

    public DisbursePaymentHandler(IApplicationDbContext context, IJournalService journalService)
    {
        _context = context;
        _journalService = journalService;
    }

    public async Task<Result<int>> Handle(DisbursePaymentCommand request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup)
            .Include(a => a.WinningTicket)
            .ThenInclude(t => t.Member)
            .FirstOrDefaultAsync(a => a.Id == request.AuctionId, cancellationToken);

        if (auction == null) return Result<int>.Failure("Auction not found.");
        if (auction.AuctionStatus != "Closed") return Result<int>.Failure("Auction must be closed to disburse payment.");
        if (auction.WinningTicketId == null) return Result<int>.Failure("No winner found for this auction.");
        
        if (auction.IsPaid) return Result<int>.Failure($"Payment already disbursed on {auction.PaymentDate?.ToShortDateString()}.");

        // Update Auction State
        auction.IsPaid = true;
        auction.PaymentDate = request.PaymentDate;
        auction.PaymentMode = request.PaymentMode;
        auction.PaymentReference = request.ReferenceNumber;

        // Journal Entry
        // Debit: Prize Payable (Liability decreasing)
        // Credit: Bank (Asset decreasing)
        
        var journalLines = new List<(string AccountCode, decimal Debit, decimal Credit)>
        {
            ("LIABILITY-PRIZE-PAYABLE", auction.NetPayableAmount, 0),
            ("ASSET-BANK", 0, auction.NetPayableAmount) // Assuming mainly Bank transfers for large amounts
        };

        if (request.PaymentMode == "Cash")
        {
             journalLines[1] = ("ASSET-CASH", 0, auction.NetPayableAmount);
        }

        await _journalService.CreateEntryAsync(
            "Payout",
            request.PaymentDate,
            $"Prize Money Payout for Auction {auction.Id} - Ticket {auction.WinningTicket.TicketNumber}",
            auction.Id,
            "Auction",
            auction.BranchId,
            journalLines,
            cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(auction.Id);
    }
}
