using ChitStack.Application.Features.Auctions.Commands.CloseAuction;
using ChitStack.Application.Features.Auctions.Commands.PlaceProxyBid;
using ChitStack.Application.Features.Auctions.Commands.MarkAttendance;
using ChitStack.Application.Features.Auctions.Commands.StartAuction;
using ChitStack.Application.Features.Auctions.Commands.PlaceBid;
using ChitStack.Application.Features.Auctions.Commands.ScheduleAuction;
using ChitStack.Application.Features.Auctions.Queries.GetAuctionAttendance;
using ChitStack.Application.Features.Auctions.Queries.GetAuctions;
using ChitStack.Application.Features.Auctions.Queries.GetAuctionBids;
using ChitStack.Application.Features.Auctions.Queries.GetAuctionDemands;
using ChitStack.Application.Features.Auctions.Commands.UpdateAuctionCompletion;
using ChitStack.Application.Features.Auctions.Commands.RevertAuction;
using ChitStack.Application.Features.Auctions.Commands.RunLottery;
using ChitStack.API.Services;
using ChitStack.Domain.Common;
using ChitStack.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitStack.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AuctionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly TieBreakerOrchestrator _tieBreakerOrchestrator;

    public AuctionsController(IMediator mediator, TieBreakerOrchestrator tieBreakerOrchestrator)
    {
        _mediator = mediator;
        _tieBreakerOrchestrator = tieBreakerOrchestrator;
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

    [HttpGet("{id}/demands")]
    public async Task<ActionResult<Result<List<AuctionDemandDto>>>> GetDemands(int id)
    {
        return Ok(await _mediator.Send(new GetAuctionDemandsQuery { AuctionId = id }));
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
    [HttpPost("{auctionId}/revert")]
    public async Task<ActionResult<Result<int>>> Revert(int auctionId)
    {
        var result = await _mediator.Send(new RevertAuctionCommand { AuctionId = auctionId });
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

    [Authorize(Roles = "Admin,Manager,Subscriber")]
    [HttpPost("{auctionId}/lottery")]
    public async Task<ActionResult<Result<int>>> Lottery(int auctionId)
    {
        _tieBreakerOrchestrator.Cancel(auctionId);
        var result = await _mediator.Send(new RunLotteryCommand { AuctionId = auctionId });
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager,Subscriber")]
    [HttpPost("{auctionId}/start-tiebreaker")]
    public async Task<ActionResult<Result<bool>>> StartTieBreaker(int auctionId)
    {
        var started = await _tieBreakerOrchestrator.StartAsync(auctionId, HttpContext.RequestAborted);
        return Ok(Result<bool>.Success(started));
    }
}
