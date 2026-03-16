using ChitLedger.Application.Features.Groups.Commands.LaunchGroup;
using ChitLedger.Application.Features.Auctions.Commands;
using ChitLedger.Application.Features.ChitGroups.Commands.CreateChitGroup;
using ChitLedger.Application.Features.ChitGroups.Commands.UpdateChitGroup;
using ChitLedger.Application.Features.ChitGroups.Commands.UpdateChitGroupStatutoryInfo;
using ChitLedger.Application.Features.ChitGroups.Queries.GetChitGroups;
using ChitLedger.Application.Features.Tickets.Queries.GetTickets;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

[Authorize(Roles = "Admin,Manager,Subscriber")]
[ApiController]
[Route("api/[controller]")]
public class ChitGroupsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ChitGroupsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<Result<List<ChitGroupDto>>>> Get()
    {
        return Ok(await _mediator.Send(new GetChitGroupsQuery()));
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public async Task<ActionResult<Result<int>>> Create(CreateChitGroupCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{id}")]
    public async Task<ActionResult<Result<int>>> Update(int id, UpdateChitGroupCommand command)
    {
        if (id != command.Id) return BadRequest(Result<int>.Failure("ID mismatch"));
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>Update the statutory/regulatory fields for a group.</summary>
    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{id}/statutory")]
    public async Task<ActionResult<Result<int>>> UpdateStatutoryInfo(int id, UpdateChitGroupStatutoryInfoCommand command)
    {
        if (id != command.Id) return BadRequest(Result<int>.Failure("ID mismatch"));
        var result = await _mediator.Send(command);
        return result.Succeeded ? Ok(result) : BadRequest(new { errors = result.Errors });
    }

    // ── Auction Schedule ──────────────────────────────────────────────────────

    /// <summary>Preview auto-generated schedule dates (Sunday/holiday-aware). Does not save.</summary>
    [HttpGet("{id}/schedule-preview")]
    public async Task<ActionResult<Result<List<AuctionScheduleSlotDto>>>> GetSchedulePreview(int id, [FromQuery] string firstAuctionDate)
    {
        var result = await _mediator.Send(new GenerateAuctionScheduleQuery { GroupId = id, FirstAuctionDate = firstAuctionDate });
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    /// <summary>Get the saved auction schedule for a group (all N installment slots).</summary>
    [HttpGet("{id}/schedule")]
    public async Task<ActionResult<Result<List<GroupAuctionSlotDto>>>> GetSchedule(int id)
    {
        var result = await _mediator.Send(new GetGroupAuctionScheduleQuery { GroupId = id });
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    /// <summary>Save (upsert) the auction schedule for a group.</summary>
    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("{id}/schedule")]
    public async Task<ActionResult<Result<bool>>> SaveSchedule(int id, [FromBody] SaveAuctionScheduleCommand command)
    {
        command.GroupId = id;
        var result = await _mediator.Send(command);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    /// <summary>Launch the group — validates all tickets enrolled and all N auction dates are set.</summary>
    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("{id}/launch")]
    public async Task<ActionResult<Result<int>>> Launch(int id)
    {
        var result = await _mediator.Send(new LaunchGroupWithScheduleCommand { GroupId = id });
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{id}/tickets")]
    public async Task<ActionResult<Result<List<TicketDto>>>> GetTickets(int id)
    {
        return Ok(await _mediator.Send(new GetTicketsQuery { ChitGroupId = id }));
    }
}
