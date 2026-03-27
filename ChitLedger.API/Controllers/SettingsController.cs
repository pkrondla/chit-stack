using ChitLedger.Application.Features.Settings.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SettingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ── Company Profile ──────────────────────────────────────────────────────

    /// <summary>Get the company/tenant profile settings used in statutory forms.</summary>
    [Authorize(Roles = "Admin,Manager,Subscriber,Agent")]
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var result = await _mediator.Send(new GetTenantSettingsQuery());
        return result.Succeeded ? Ok(result.Data) : NotFound(result.Errors.FirstOrDefault());
    }

    /// <summary>Create or update the company/tenant profile settings.</summary>
    [Authorize(Roles = "Admin,Manager")]
    [HttpPut]
    public async Task<IActionResult> Upsert([FromBody] UpsertTenantSettingsCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Succeeded ? Ok(result.Data) : BadRequest(new { errors = result.Errors });
    }

    // ── Holidays ─────────────────────────────────────────────────────────────

    /// <summary>Get all tenant-wide holidays.</summary>
    [Authorize(Roles = "Admin,Manager,Subscriber")]
    [HttpGet("holidays")]
    public async Task<IActionResult> GetHolidays()
    {
        var result = await _mediator.Send(new GetHolidayDatesQuery());
        return Ok(result.Data);
    }

    /// <summary>Add a new holiday.</summary>
    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("holidays")]
    public async Task<IActionResult> AddHoliday([FromBody] AddHolidayCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Succeeded ? Ok(result.Data) : BadRequest(new { errors = result.Errors });
    }

    /// <summary>Delete a holiday.</summary>
    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("holidays/{id}")]
    public async Task<IActionResult> DeleteHoliday(int id)
    {
        var result = await _mediator.Send(new DeleteHolidayCommand { Id = id });
        return result.Succeeded ? Ok() : NotFound(result.Errors.FirstOrDefault());
    }
}
