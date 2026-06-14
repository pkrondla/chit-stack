using ChitStack.Application.Features.Catalog.Commands.DeleteComponent;
using ChitStack.Application.Features.Catalog.Commands.UpsertComponent;
using ChitStack.Application.Features.Catalog.Queries.GetComponents;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitStack.Global.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CatalogController : ControllerBase
{
    private readonly IMediator _mediator;

    public CatalogController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Public — returns active components for the order form.</summary>
    [HttpGet("components")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<List<SoftwareComponentDto>>>> GetComponents()
    {
        return Ok(await _mediator.Send(new GetCatalogComponentsQuery { IncludeInactive = false }));
    }

    /// <summary>Admin — returns all components including inactive.</summary>
    [HttpGet("admin/components")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<List<SoftwareComponentDto>>>> GetAllComponents()
    {
        return Ok(await _mediator.Send(new GetCatalogComponentsQuery { IncludeInactive = true }));
    }

    [HttpPost("admin/components")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<int>>> Create(UpsertCatalogComponentCommand command)
    {
        command.Id = null;
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("admin/components/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<int>>> Update(int id, UpsertCatalogComponentCommand command)
    {
        command.Id = id;
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("admin/components/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<bool>>> Delete(int id)
    {
        var result = await _mediator.Send(new DeleteCatalogComponentCommand { Id = id });
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }
}
