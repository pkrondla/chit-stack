using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.CustomerPortal.Queries.GetMyAuctions;

public class MyAuctionDto
{
    public int AuctionId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public DateTime AuctionDate { get; set; }
    public int InstallmentNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? WinningBidAmount { get; set; }
    public string? WinnerName { get; set; }
    public bool IsMyGroup { get; set; }
}

public class GetMyAuctionsQuery : IRequest<Result<List<MyAuctionDto>>>
{
}

public class GetMyAuctionsHandler : IRequestHandler<GetMyAuctionsQuery, Result<List<MyAuctionDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyAuctionsHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<MyAuctionDto>>> Handle(GetMyAuctionsQuery request, CancellationToken cancellationToken)
    {
        var memberId = _currentUserService.MemberId;
        if (memberId == null)
            return Result<List<MyAuctionDto>>.Failure("User is not linked to a Member profile.");

        // Get groups the member is part of
        var myGroupIds = await _context.Tickets
            .Where(t => t.MemberId == memberId)
            .Select(t => t.ChitGroupId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var auctions = await _context.Auctions
            .Include(a => a.ChitGroup)
            .Where(a => myGroupIds.Contains(a.ChitGroupId))
            .OrderByDescending(a => a.AuctionDate)
            .ToListAsync(cancellationToken);

        var response = auctions.Select(a => new MyAuctionDto
        {
            AuctionId = a.Id,
            GroupName = a.ChitGroup?.GroupName ?? "Unknown Group",
            AuctionDate = a.AuctionDate,
            InstallmentNumber = a.InstallmentNumber,
            Status = a.AuctionStatus,
            WinningBidAmount = a.WinningBidAmount,
            IsMyGroup = true
        }).ToList();

        return Result<List<MyAuctionDto>>.Success(response);
    }
}
