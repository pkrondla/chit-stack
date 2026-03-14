using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Groups.Commands.LaunchGroup;

// ─────────────────────────────────────────────────────────────────────────────
// DTO for a single preview row
// ─────────────────────────────────────────────────────────────────────────────
public class AuctionScheduleSlotDto
{
    public int InstallmentNumber { get; set; }
    public string OriginalDate { get; set; } = string.Empty;   // The raw computed date
    public string ScheduledDate { get; set; } = string.Empty;  // After Sunday/holiday shift
    public string Time { get; set; } = string.Empty;
    public bool IsAdjusted { get; set; }
    public string AdjustmentReason { get; set; } = string.Empty;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY — Preview schedule (no DB writes)
// ─────────────────────────────────────────────────────────────────────────────
public class GenerateAuctionScheduleQuery : IRequest<Result<List<AuctionScheduleSlotDto>>>
{
    public int GroupId { get; set; }
    public string FirstAuctionDate { get; set; } = string.Empty;  // "yyyy-MM-dd"
}

public class GenerateAuctionScheduleHandler : IRequestHandler<GenerateAuctionScheduleQuery, Result<List<AuctionScheduleSlotDto>>>
{
    private readonly IApplicationDbContext _context;
    public GenerateAuctionScheduleHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<List<AuctionScheduleSlotDto>>> Handle(GenerateAuctionScheduleQuery request, CancellationToken cancellationToken)
    {
        var group = await _context.ChitGroups.FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);
        if (group == null) return Result<List<AuctionScheduleSlotDto>>.Failure("Group not found.");
        if (group.Status != GroupStatus.Proposed) return Result<List<AuctionScheduleSlotDto>>.Failure("Group is already launched.");

        if (!DateOnly.TryParse(request.FirstAuctionDate, out var firstDate))
            return Result<List<AuctionScheduleSlotDto>>.Failure("Invalid first auction date.");

        // Load all holidays for this tenant
        var holidays = await _context.HolidayDates.ToListAsync(cancellationToken);
        var year = firstDate.Year;

        HashSet<DateOnly> holidaySet = BuildHolidaySet(holidays, year, year + 3);

        var slots = new List<AuctionScheduleSlotDto>();
        var timeStr = group.AuctionTime.HasValue ? group.AuctionTime.Value.ToString("hh:mm tt") : "04:00 PM";

        for (int i = 0; i < group.DurationMonths; i++)
        {
            DateOnly raw = ComputeRawDate(group, firstDate, i);
            (DateOnly shifted, string reason) = ShiftIfNeeded(raw, holidaySet);

            slots.Add(new AuctionScheduleSlotDto
            {
                InstallmentNumber = i + 1,
                OriginalDate = raw.ToString("yyyy-MM-dd"),
                ScheduledDate = shifted.ToString("yyyy-MM-dd"),
                Time = timeStr,
                IsAdjusted = shifted != raw,
                AdjustmentReason = reason
            });
        }

        return Result<List<AuctionScheduleSlotDto>>.Success(slots);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static DateOnly ComputeRawDate(ChitGroup group, DateOnly firstDate, int installmentIndex)
    {
        if (installmentIndex == 0) return firstDate;

        if (group.AuctionScheduleMode == "SameWeekday"
            && group.AuctionWeekNumber.HasValue && group.AuctionDayOfWeek.HasValue)
        {
            int targetMonth = firstDate.Month + installmentIndex;
            int targetYear = firstDate.Year + (targetMonth - 1) / 12;
            targetMonth = ((targetMonth - 1) % 12) + 1;
            return NthWeekdayOfMonth(targetYear, targetMonth, group.AuctionDayOfWeek.Value, group.AuctionWeekNumber.Value);
        }
        else
        {
            // FixedDay mode - supports multiple days e.g. "1, 10, 20"
            var days = ParseDays(group.AuctionDayOfMonth, firstDate.Day);
            
            DateOnly current = firstDate;
            for (int i = 0; i < installmentIndex; i++)
            {
                int nextDayIndex = days.FindIndex(d => d > current.Day);
                if (nextDayIndex != -1)
                {
                    current = new DateOnly(current.Year, current.Month, Math.Min(days[nextDayIndex], DateTime.DaysInMonth(current.Year, current.Month)));
                }
                else
                {
                    // Move to next month
                    int nextMonth = current.Month + 1;
                    int nextYear = current.Year + (nextMonth - 1) / 12;
                    nextMonth = ((nextMonth - 1) % 12) + 1;
                    current = new DateOnly(nextYear, nextMonth, Math.Min(days[0], DateTime.DaysInMonth(nextYear, nextMonth)));
                }
            }
            return current;
        }
    }

    private static List<int> ParseDays(string? dayString, int defaultDay)
    {
        if (string.IsNullOrWhiteSpace(dayString))
            return new List<int> { defaultDay };

        var days = dayString.Split(',')
            .Select(s => int.TryParse(s.Trim(), out int d) ? d : (int?)null)
            .Where(d => d.HasValue && d.Value >= 1 && d.Value <= 31)
            .Select(d => d!.Value)
            .Distinct()
            .OrderBy(d => d)
            .ToList();

        return days.Count > 0 ? days : new List<int> { defaultDay };
    }

    private static DateOnly NthWeekdayOfMonth(int year, int month, int dayOfWeek, int weekNumber)
    {
        var first = new DateOnly(year, month, 1);
        int diff = ((int)dayOfWeek - (int)first.DayOfWeek + 7) % 7;
        var candidate = first.AddDays(diff);

        if (weekNumber == 5) // "Last"
        {
            while (candidate.AddDays(7).Month == month) candidate = candidate.AddDays(7);
        }
        else
        {
            candidate = candidate.AddDays(7 * (weekNumber - 1));
        }

        return candidate;
    }

    private static (DateOnly shifted, string reason) ShiftIfNeeded(DateOnly date, HashSet<DateOnly> holidays)
    {
        var original = date;
        string reason = string.Empty;

        // Shift Sunday → Monday
        if (date.DayOfWeek == DayOfWeek.Sunday)
        {
            date = date.AddDays(1);
            reason = "Shifted from Sunday";
        }

        // Shift holidays forward (skip further Sundays too)
        int safety = 0;
        while (holidays.Contains(date) && safety++ < 10)
        {
            date = date.AddDays(1);
            if (date.DayOfWeek == DayOfWeek.Sunday) date = date.AddDays(1);
            reason = string.IsNullOrEmpty(reason) ? "Shifted due to holiday" : reason + " + holiday";
        }

        return (date, reason);
    }

    private static HashSet<DateOnly> BuildHolidaySet(List<HolidayDate> holidays, int fromYear, int toYear)
    {
        var set = new HashSet<DateOnly>();
        foreach (var h in holidays)
        {
            if (h.IsRecurringYearly)
            {
                for (int y = fromYear; y <= toYear; y++)
                {
                    try { set.Add(new DateOnly(y, h.Date.Month, h.Date.Day)); } catch { }
                }
            }
            else
            {
                set.Add(h.Date);
            }
        }
        return set;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND — Launch group (validates schedule is complete, then activates)
// ─────────────────────────────────────────────────────────────────────────────
public class LaunchGroupWithScheduleCommand : IRequest<Result<int>>
{
    public int GroupId { get; set; }
}

public class LaunchGroupWithScheduleHandler : IRequestHandler<LaunchGroupWithScheduleCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    public LaunchGroupWithScheduleHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<int>> Handle(LaunchGroupWithScheduleCommand request, CancellationToken cancellationToken)
    {
        var group = await _context.ChitGroups
            .Include(g => g.Tickets)
            .FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);

        if (group == null) return Result<int>.Failure("Group not found.");
        if (group.Status != GroupStatus.Proposed) return Result<int>.Failure("Group is already launched or closed.");

        if (group.Tickets.Count < group.DurationMonths)
            return Result<int>.Failure($"Cannot launch. Only {group.Tickets.Count}/{group.DurationMonths} tickets enrolled.");

        // Validate auction schedule is fully set up
        var auctionCount = await _context.Auctions
            .CountAsync(a => a.ChitGroupId == request.GroupId, cancellationToken);

        if (auctionCount < group.DurationMonths)
            return Result<int>.Failure(
                $"Auction schedule is incomplete. {auctionCount}/{group.DurationMonths} months scheduled. " +
                "Please set dates for all months in Auction Scheduler before launching.");

        // Activate the group
        group.Status = GroupStatus.Active;
        group.LaunchDate = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(group.Id);
    }
}

