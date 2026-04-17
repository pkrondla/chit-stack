using ChitStack.Application.Features.Nominees.Commands.UpdateNominee;
using ChitStack.Application.Features.Nominees.Queries.GetNominee;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitStack.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NomineesController : ControllerBase
{
    private readonly IMediator _mediator;

    public NomineesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{ticketId}")]
    public async Task<ActionResult<Result<NomineeDto?>>> Get(int ticketId)
    {
        return Ok(await _mediator.Send(new GetNomineeQuery { TicketId = ticketId }));
    }

    [HttpPost]
    public async Task<ActionResult<Result<int>>> Upsert(UpdateNomineeCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }
}
