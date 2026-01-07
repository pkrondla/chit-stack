using ChitLedger.Application.Features.ChitGroups.Commands.CreateChitGroup;
using ChitLedger.Application.Features.ChitGroups.Queries.GetChitGroups;
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
}
