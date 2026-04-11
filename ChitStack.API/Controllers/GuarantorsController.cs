using ChitStack.Application.Features.Guarantors.Commands.AddGuarantor;
using ChitStack.Application.Features.Guarantors.Queries.GetGuarantors;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitStack.API.Controllers;

[Authorize(Roles = "Admin,Manager")]
[ApiController]
[Route("api/[controller]")]
public class GuarantorsController : ControllerBase
{
    private readonly IMediator _mediator;

    public GuarantorsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<Result<int>>> Add(AddGuarantorCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("{ticketId}")]
    public async Task<ActionResult<Result<List<GuarantorDto>>>> GetList(int ticketId)
    {
        return Ok(await _mediator.Send(new GetGuarantorsQuery { TicketId = ticketId }));
    }
}
