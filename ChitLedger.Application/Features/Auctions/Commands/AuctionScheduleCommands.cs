using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Auctions.Commands;

// ─────────────────────────────────────────────────────────────────────────────
// DTO
// ─────────────────────────────────────────────────────────────────────────────
public class GroupAuctionSlotDto
{
    public int? AuctionId { get; set; }          // null if not yet created
    public int InstallmentNumber { get; set; }
    public string? ScheduledDate { get; set; }   // "yyyy-MM-dd"
    public string? ScheduledTime { get; set; }   // "HH:mm"
    public string AuctionStatus { get; set; } = "Pending"; // Pending / Scheduled / Open / Closed
    public bool IsEditable => AuctionStatus != "Closed";
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY — Get full schedule for a group (all N slots)
// ─────────────────────────────────────────────────────────────────────────────
public class GetGroupAuctionScheduleQuery : IRequest<Result<List<GroupAuctionSlotDto>>>
{
    public int GroupId { get; set; }
}

public class GetGroupAuctionScheduleHandler : IRequestHandler<GetGroupAuctionScheduleQuery, Result<List<GroupAuctionSlotDto>>>
{
    private readonly IApplicationDbContext _context;
    public GetGroupAuctionScheduleHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<List<GroupAuctionSlotDto>>> Handle(GetGroupAuctionScheduleQuery request, CancellationToken cancellationToken)
    {
        var group = await _context.ChitGroups
            .FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);
        if (group == null) return Result<List<GroupAuctionSlotDto>>.Failure("Group not found.");

        var auctions = await _context.Auctions
            .Where(a => a.ChitGroupId == request.GroupId)
            .OrderBy(a => a.InstallmentNumber)
            .ToListAsync(cancellationToken);

        var auctionByInstallment = auctions.ToDictionary(a => a.InstallmentNumber);

        var slots = Enumerable.Range(1, group.DurationMonths).Select(i =>
        {
            if (auctionByInstallment.TryGetValue(i, out var auction))
            {
                return new GroupAuctionSlotDto
                {
                    AuctionId = auction.Id,
                    InstallmentNumber = i,
                    ScheduledDate = DateOnly.FromDateTime(auction.AuctionDate).ToString("yyyy-MM-dd"),
                    ScheduledTime = TimeOnly.FromDateTime(auction.AuctionDate).ToString("HH:mm"),
                    AuctionStatus = auction.AuctionStatus
                };
            }
            return new GroupAuctionSlotDto { InstallmentNumber = i, AuctionStatus = "Pending" };
        }).ToList();

        return Result<List<GroupAuctionSlotDto>>.Success(slots);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND — Save / upsert the full schedule for a group
// ─────────────────────────────────────────────────────────────────────────────
public class SaveAuctionScheduleCommand : IRequest<Result<bool>>
{
    public int GroupId { get; set; }
    public List<AuctionSlotInput> Slots { get; set; } = new();
}

public class AuctionSlotInput
{
    public int InstallmentNumber { get; set; }
    public string? Date { get; set; }  // "yyyy-MM-dd" — null to clear
    public string? Time { get; set; }  // "HH:mm"
}

public class SaveAuctionScheduleHandler : IRequestHandler<SaveAuctionScheduleCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    public SaveAuctionScheduleHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<bool>> Handle(SaveAuctionScheduleCommand request, CancellationToken cancellationToken)
    {
        var group = await _context.ChitGroups
            .FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);
        if (group == null) return Result<bool>.Failure("Group not found.");

        var existingAuctions = await _context.Auctions
            .Where(a => a.ChitGroupId == request.GroupId)
            .ToListAsync(cancellationToken);

        var byInstallment = existingAuctions.ToDictionary(a => a.InstallmentNumber);

        foreach (var slot in request.Slots)
        {
            if (string.IsNullOrWhiteSpace(slot.Date)) continue; // skip blanks

            if (!DateOnly.TryParse(slot.Date, out var date)) continue;
            TimeOnly time = TimeOnly.TryParse(slot.Time ?? "16:00", out var t) ? t : new TimeOnly(16, 0);
            var dt = new DateTime(date.Year, date.Month, date.Day, time.Hour, time.Minute, 0);

            if (byInstallment.TryGetValue(slot.InstallmentNumber, out var existing))
            {
                // Only update non-closed auctions
                if (existing.AuctionStatus != "Closed")
                {
                    existing.AuctionDate = dt;
                }
            }
            else
            {
                _context.Auctions.Add(new Auction
                {
                    ChitGroupId = request.GroupId,
                    InstallmentNumber = slot.InstallmentNumber,
                    AuctionDate = dt,
                    AuctionStatus = "Scheduled",
                    WinningBidAmount = 0,
                    DividendAmount = 0,
                    NetPayableAmount = 0
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
