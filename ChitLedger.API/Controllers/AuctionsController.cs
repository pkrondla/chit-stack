using ChitLedger.Application.Features.Auctions.Commands.CloseAuction;
using ChitLedger.Application.Features.Auctions.Commands.PlaceProxyBid;
using ChitLedger.Application.Features.Auctions.Commands.MarkAttendance;
using ChitLedger.Application.Features.Auctions.Commands.StartAuction;
using ChitLedger.Application.Features.Auctions.Commands.PlaceBid;
using ChitLedger.Application.Features.Auctions.Commands.ScheduleAuction;
using ChitLedger.Application.Features.Auctions.Queries.GetAuctionAttendance;
using ChitLedger.Application.Features.Auctions.Queries.GetAuctions;
using ChitLedger.Application.Features.Auctions.Queries.GetAuctionBids;
using ChitLedger.Application.Features.Auctions.Commands.UpdateAuctionCompletion;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AuctionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuctionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<Result<List<AuctionDto>>>> Get(
        [FromQuery] int? chitGroupId, 
        [FromQuery] int? memberId,
        [FromQuery] bool? isPaid,
        [FromQuery] DateTime? fromDate, 
        [FromQuery] DateTime? toDate)
    {
        return Ok(await _mediator.Send(new GetAuctionsQuery 
        { 
            ChitGroupId = chitGroupId,
            MemberId = memberId,
            IsPaid = isPaid,
            FromDate = fromDate,
            ToDate = toDate
        }));
    }

    [HttpGet("{auctionId}/attendance")]
    public async Task<ActionResult<Result<List<AttendanceDto>>>> GetAttendance(int auctionId)
    {
        return Ok(await _mediator.Send(new GetAuctionAttendanceQuery { AuctionId = auctionId }));
    }

    [HttpGet("{auctionId}/bids")]
    public async Task<ActionResult<Result<List<BidDto>>>> GetBids(int auctionId)
    {
        return Ok(await _mediator.Send(new GetAuctionBidsQuery { AuctionId = auctionId }));
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("schedule")]
    public async Task<ActionResult<Result<int>>> Schedule(ScheduleAuctionCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager,Subscriber")]
    [HttpPost("bid")]
    public async Task<ActionResult<Result<bool>>> PlaceBid(PlaceBidCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("start")]
    public async Task<ActionResult<Result<bool>>> Start(StartAuctionCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("attendance")]
    public async Task<ActionResult<Result<bool>>> Attendance(MarkAttendanceCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("proxy-bid")]
    public async Task<ActionResult<Result<int>>> ProxyBid(PlaceProxyBidCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("close")]
    public async Task<ActionResult<Result<int>>> Close(CloseAuctionCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("update-payout")]
    public async Task<ActionResult<Result<int>>> UpdatePayout(UpdateAuctionCompletionCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }
}
