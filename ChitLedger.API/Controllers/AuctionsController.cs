using ChitLedger.Application.Features.Auctions.Commands.CloseAuction;
using ChitLedger.Application.Features.Auctions.Commands.PlaceProxyBid;
using ChitLedger.Application.Features.Auctions.Commands.PlaceBid;
using ChitLedger.Application.Features.Auctions.Commands.ScheduleAuction;
using ChitLedger.Application.Features.Auctions.Queries.GetAuctions;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

[Authorize(Roles = "Admin,Manager")]
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
    public async Task<ActionResult<Result<List<AuctionDto>>>> Get([FromQuery] int? groupId)
    {
        return Ok(await _mediator.Send(new GetAuctionsQuery { ChitGroupId = groupId }));
    }

    [HttpPost("schedule")]
    public async Task<ActionResult<Result<int>>> Schedule(ScheduleAuctionCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("bid")]
    public async Task<ActionResult<Result<bool>>> PlaceBid(PlaceBidCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("close")]
    public async Task<ActionResult<Result<int>>> Close(CloseAuctionCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }
}
