using ChitLedger.Application.Features.Tenants.Commands.CreateTenant;
using ChitLedger.Application.Features.Tenants.Queries.GetTenants;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

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
    public async Task<ActionResult<Result<List<TenantDto>>>> Get()
    {
        return Ok(await _mediator.Send(new GetTenantsQuery()));
    }

    [HttpPost]
    public async Task<ActionResult<Result<int>>> Create(CreateTenantCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }
}
