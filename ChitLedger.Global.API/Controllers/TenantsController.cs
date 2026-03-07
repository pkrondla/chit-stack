using ChitLedger.Application.Features.GlobalTenants.Commands.CreateGlobalTenant;
using ChitLedger.Application.Features.GlobalTenants.Queries.GetGlobalTenants;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.Global.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class TenantsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TenantsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<Result<List<GlobalTenantDto>>>> Get()
    {
        return Ok(await _mediator.Send(new GetGlobalTenantsQuery()));
    }

    [HttpPost]
    public async Task<ActionResult<Result<int>>> Create(CreateGlobalTenantCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }
}
