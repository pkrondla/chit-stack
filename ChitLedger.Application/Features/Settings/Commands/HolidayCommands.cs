using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Settings.Commands;

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────
public class HolidayDateDto
{
    public int Id { get; set; }
    public string Date { get; set; } = string.Empty;          // "yyyy-MM-dd"
    public string Description { get; set; } = string.Empty;
    public bool IsRecurringYearly { get; set; }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET all holidays
// ─────────────────────────────────────────────────────────────────────────────
public class GetHolidayDatesQuery : IRequest<Result<List<HolidayDateDto>>> { }

public class GetHolidayDatesHandler : IRequestHandler<GetHolidayDatesQuery, Result<List<HolidayDateDto>>>
{
    private readonly IApplicationDbContext _context;
    public GetHolidayDatesHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<List<HolidayDateDto>>> Handle(GetHolidayDatesQuery request, CancellationToken cancellationToken)
    {
        var holidays = await _context.HolidayDates
            .OrderBy(h => h.Date)
            .Select(h => new HolidayDateDto
            {
                Id = h.Id,
                Date = h.Date.ToString("yyyy-MM-dd"),
                Description = h.Description,
                IsRecurringYearly = h.IsRecurringYearly
            })
            .ToListAsync(cancellationToken);

        return Result<List<HolidayDateDto>>.Success(holidays);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD single holiday
// ─────────────────────────────────────────────────────────────────────────────
public class AddHolidayCommand : IRequest<Result<int>>
{
    public string Date { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsRecurringYearly { get; set; }
}

public class AddHolidayHandler : IRequestHandler<AddHolidayCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    public AddHolidayHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<int>> Handle(AddHolidayCommand request, CancellationToken cancellationToken)
    {
        if (!DateOnly.TryParse(request.Date, out var date))
            return Result<int>.Failure("Invalid date format. Use yyyy-MM-dd.");

        var holiday = new HolidayDate
        {
            Date = date,
            Description = request.Description,
            IsRecurringYearly = request.IsRecurringYearly
        };

        _context.HolidayDates.Add(holiday);
        await _context.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(holiday.Id);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE holiday
// ─────────────────────────────────────────────────────────────────────────────
public class DeleteHolidayCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}

public class DeleteHolidayHandler : IRequestHandler<DeleteHolidayCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    public DeleteHolidayHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<bool>> Handle(DeleteHolidayCommand request, CancellationToken cancellationToken)
    {
        var holiday = await _context.HolidayDates.FindAsync(new object[] { request.Id }, cancellationToken);
        if (holiday == null) return Result<bool>.Failure("Holiday not found.");

        _context.HolidayDates.Remove(holiday);
        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
