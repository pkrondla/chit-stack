using AutoMapper;
using AutoMapper.QueryableExtensions;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Auctions.Queries.GetAuctionAttendance;

public class AttendanceDto
{
    public int TicketId { get; set; }
    public int TicketNumber { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public bool IsPresent { get; set; }
    public bool IsForeman { get; set; }
    public bool IsPrized { get; set; }
    public int? PrizedInstallment { get; set; }
}

public class GetAuctionAttendanceQuery : IRequest<Result<List<AttendanceDto>>>
{
    public int AuctionId { get; set; }
}

public class GetAuctionAttendanceHandler : IRequestHandler<GetAuctionAttendanceQuery, Result<List<AttendanceDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetAuctionAttendanceHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<AttendanceDto>>> Handle(GetAuctionAttendanceQuery request, CancellationToken cancellationToken)
    {
        var auction = await _context.Auctions.FindAsync(new object[] { request.AuctionId }, cancellationToken);
        if (auction == null) return Result<List<AttendanceDto>>.Failure("Auction not found.");

        // Get all tickets for the group
        var tickets = await _context.Tickets
            .Include(t => t.Member)
            .Where(t => t.ChitGroupId == auction.ChitGroupId)
            .ToListAsync(cancellationToken);

        // Get attendance records - resilient to missing table
        var attendanceRecords = new List<AuctionAttendance>();
        try 
        {
            attendanceRecords = await _context.AuctionAttendances
                .Where(a => a.AuctionId == request.AuctionId)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            // Log error if logger was available, but don't fail the request
            // This handles cases where migrations haven't been run yet
        }

        var result = tickets.Select(t => {
            var att = attendanceRecords.FirstOrDefault(a => a.TicketId == t.Id);
            return new AttendanceDto
            {
                TicketId = t.Id,
                TicketNumber = t.TicketNumber,
                MemberName = t.Member?.FullName ?? $"Ticket #{t.TicketNumber}",
                PhotoUrl = t.Member?.PhotoUrl,
                IsForeman = t.IsForeman,
                IsPrized = t.IsPrized,
                PrizedInstallment = t.PrizedInstallment,
                // Foreman is present by default if no explicit record exists
                IsPresent = att != null ? att.IsPresent : (t.IsForeman ? true : false)
            };
        }).OrderBy(x => x.TicketNumber).ToList();

        return Result<List<AttendanceDto>>.Success(result);
    }
}
