using ChitLedger.Application.Features.Tickets.Commands.AssignVacancy;
using ChitLedger.Application.Features.Tickets.Commands.RemoveSubscriber;
using ChitLedger.Application.Features.Tickets.Queries.GetTicketDues;
using ChitLedger.Application.Features.Tickets.Queries.GetTickets;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

[Authorize(Roles = "Admin,Manager")]
[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TicketsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("remove")]
    public async Task<ActionResult<Result<int>>> RemoveSubscriber(RemoveSubscriberCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("assign-vacancy")]
    public async Task<ActionResult<Result<int>>> AssignVacancy(AssignVacancyCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("{groupId}")]
    public async Task<ActionResult<Result<List<TicketDto>>>> GetTickets(int groupId)
    {
        return Ok(await _mediator.Send(new GetTicketsQuery { ChitGroupId = groupId }));
    }

    [HttpGet("dues/{ticketId}")]
    public async Task<ActionResult<Result<TicketDuesDto>>> GetDues(int ticketId)
    {
        return Ok(await _mediator.Send(new GetTicketDuesQuery { TicketId = ticketId }));
    }
}
