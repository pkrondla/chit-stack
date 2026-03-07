using ChitLedger.Application.Auth.Commands.GlobalLogin;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.Global.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<string>>> Login(GlobalLoginCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded)
        {
            return Unauthorized(result);
        }
        return Ok(result);
    }
}
