using ChitStack.Application.Auth.Commands.Login;
using ChitStack.Application.Features.Auth.Commands.SendOtp;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitStack.API.Controllers;

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
    public async Task<ActionResult<Result<LoginResponse>>> Login(LoginCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded)
        {
            // Return 402 Payment Required specifically for trial expiry
            if (result.Errors.Any(e => e == "TrialExpired"))
                return StatusCode(402, new { error = "TrialExpired", message = "Your demo trial has ended. Please subscribe to continue." });

            return Unauthorized(result);
        }
        return Ok(result);
    }

    [HttpPost("send-otp")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<string>>> SendOtp(SendOtpCommand command)
    {
        return Ok(await _mediator.Send(command));
    }
}
