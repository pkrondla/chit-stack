using ChitLedger.Application.Features.Members.Commands.CreateMember;
using ChitLedger.Application.Features.Members.Queries.GetMembers;
using ChitLedger.Application.Features.Tickets.Commands.AllocateTicket;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MembersController : ControllerBase
{
    private readonly IMediator _mediator;

    public MembersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<Result<List<MemberDto>>>> Get()
    {
        return Ok(await _mediator.Send(new GetMembersQuery()));
    }

    [HttpPost]
    public async Task<ActionResult<Result<int>>> Create(CreateMemberCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("allocate-ticket")]
    public async Task<ActionResult<Result<int>>> AllocateTicket(AllocateTicketCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }
}
