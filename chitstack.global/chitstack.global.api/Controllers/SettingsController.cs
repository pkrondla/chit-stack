using ChitStack.Application.Common.Interfaces;
using ChitStack.Application.Features.Settings.Commands;
using ChitStack.Application.Features.Settings.Queries;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitStack.Global.API.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class SettingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SettingsController(IMediator mediator) => _mediator = mediator;

    /// <summary>Returns all settings grouped by category. Secret values are returned as null.</summary>
    [HttpGet]
    public async Task<ActionResult<Result<IReadOnlyList<GlobalSettingDto>>>> Get(CancellationToken ct)
        => Ok(await _mediator.Send(new GetSettingsQuery(), ct));

    /// <summary>Bulk-saves one or more settings. Pass null/empty value to clear. Secrets are only overwritten when a real value is provided.</summary>
    [HttpPut]
    public async Task<ActionResult<Result<bool>>> Update(
        [FromBody] UpdateSettingsCommand command,
        CancellationToken ct)
    {
        command.UpdatedBy = User.Identity?.Name ?? "Admin";
        return Ok(await _mediator.Send(command, ct));
    }
}
