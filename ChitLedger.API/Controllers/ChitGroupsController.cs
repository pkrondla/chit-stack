using ChitLedger.Application.Features.Groups.Commands.LaunchGroup;
using ChitLedger.Application.Features.ChitGroups.Commands.CreateChitGroup;
using ChitLedger.Application.Features.ChitGroups.Commands.UpdateChitGroup;
using ChitLedger.Application.Features.ChitGroups.Queries.GetChitGroups;
using ChitLedger.Application.Features.Tickets.Queries.GetTickets;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

[Authorize(Roles = "Admin,Manager")]
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

    [HttpPost]
    public async Task<ActionResult<Result<int>>> Create(CreateChitGroupCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Result<int>>> Update(int id, UpdateChitGroupCommand command)
    {
        if (id != command.Id) return BadRequest(Result<int>.Failure("ID mismatch"));

        var result = await _mediator.Send(command);
        if (!result.Succeeded)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("{id}/launch")]
    public async Task<ActionResult<Result<int>>> Launch(int id)
    {
        var result = await _mediator.Send(new LaunchGroupCommand { GroupId = id });
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("{id}/tickets")]
    public async Task<ActionResult<Result<List<TicketDto>>>> GetTickets(int id)
    {
        return Ok(await _mediator.Send(new GetTicketsQuery { ChitGroupId = id }));
    }
}
