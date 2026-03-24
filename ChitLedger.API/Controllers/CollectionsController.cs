using ChitLedger.Application.Features.Collections.Commands.CloseRouteBatch;
using ChitLedger.Application.Features.Collections.Commands.ProposeEnrollment;
using ChitLedger.Application.Features.Collections.Commands.VerifySubmission;
using ChitLedger.Application.Features.Collections.Queries.GetRouteMembers;
using ChitLedger.Application.Features.Collections.Queries.GetVacantTickets;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CollectionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CollectionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("route-members")]
    public async Task<ActionResult<Result<List<RouteMemberDto>>>> GetRouteMembers([FromQuery] int? routeId)
    {
        return Ok(await _mediator.Send(new GetRouteMembersQuery { RouteId = routeId }));
    }

    [HttpPost("close-batch")]
    public async Task<ActionResult<Result<int>>> CloseBatch(CloseRouteBatchCommand command)
    {
        return Ok(await _mediator.Send(command));
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("verify-submission")]
    public async Task<ActionResult<Result<int>>> VerifySubmission(VerifySubmissionCommand command)
    {
        return Ok(await _mediator.Send(command));
    }

    [HttpGet("vacant-tickets")]
    public async Task<ActionResult<Result<List<VacantTicketDto>>>> GetVacantTickets()
    {
        return Ok(await _mediator.Send(new GetVacantTicketsQuery()));
    }

    [HttpPost("propose-enrollment")]
    public async Task<ActionResult<Result<int>>> ProposeEnrollment(ProposeEnrollmentCommand command)
    {
        return Ok(await _mediator.Send(command));
    }
}
