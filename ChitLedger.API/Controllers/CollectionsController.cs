using ChitLedger.Application.Features.Collections.Commands.CloseRouteBatch;
using ChitLedger.Application.Features.Collections.Commands.ProposeEnrollment;
using ChitLedger.Application.Features.Collections.Commands.VerifySubmission;
using ChitLedger.Application.Features.Collections.Queries.GetRouteMembers;
using ChitLedger.Application.Features.Collections.Queries.GetSubmissions;
using ChitLedger.Application.Features.Collections.Queries.GetSubmissionDetails;
using ChitLedger.Application.Features.Collections.Queries.GetVacantTickets;
using ChitLedger.Application.Features.Collections.Commands.CreateRoute;
using ChitLedger.Application.Features.Collections.Commands.UpdateMemberRoute;
using ChitLedger.Application.Features.Collections.Queries.GetRoutes;
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

    [Authorize(Roles = "Admin,Manager,Staff")]
    [HttpGet("submissions")]
    public async Task<ActionResult<Result<List<SubmissionDto>>>> GetSubmissions([FromQuery] string? status)
    {
        return Ok(await _mediator.Send(new GetSubmissionsQuery { Status = status }));
    }

    [Authorize(Roles = "Admin,Manager,Staff")]
    [HttpGet("submissions/{id}")]
    public async Task<ActionResult<Result<SubmissionDetailsDto>>> GetSubmissionDetails(int id)
    {
        return Ok(await _mediator.Send(new GetSubmissionDetailsQuery { Id = id }));
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("verify-submission")]
    public async Task<ActionResult<Result<int>>> VerifySubmission(VerifySubmissionCommand command)
    {
        return Ok(await _mediator.Send(command));
    }

    [Authorize(Roles = "Admin,Manager,Staff")]
    [HttpGet("field-entries")]
    public async Task<ActionResult<Result<List<SubmissionReceiptDto>>>> GetFieldEntries()
    {
        return Ok(await _mediator.Send(new ChitLedger.Application.Features.Collections.Queries.GetFieldEntries.GetFieldEntriesQuery()));
    }

    [HttpGet("agent-receipts")]
    public async Task<ActionResult<Result<List<SubmissionReceiptDto>>>> GetAgentReceipts()
    {
        return Ok(await _mediator.Send(new ChitLedger.Application.Features.Collections.Queries.GetAgentReceipts.GetAgentReceiptsQuery()));
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

    [HttpGet("routes")]
    public async Task<ActionResult<Result<List<RouteDto>>>> GetRoutes()
    {
        return Ok(await _mediator.Send(new GetRoutesQuery()));
    }

    [HttpPost("routes")]
    public async Task<ActionResult<Result<int>>> CreateRoute(CreateRouteCommand command)
    {
        return Ok(await _mediator.Send(command));
    }

    [HttpGet("active-agents")]
    public async Task<ActionResult<Result<List<ChitLedger.Application.Features.Collections.Queries.GetActiveAgents.ActiveAgentDto>>>> GetActiveAgents()
    {
        return Ok(await _mediator.Send(new ChitLedger.Application.Features.Collections.Queries.GetActiveAgents.GetActiveAgentsQuery()));
    }

    [HttpPost("update-location")]
    public async Task<ActionResult<Result<int>>> UpdateLocation(ChitLedger.Application.Features.Users.Commands.UpdateUserLocation.UpdateUserLocationCommand command)
    {
        return Ok(await _mediator.Send(command));
    }
}
