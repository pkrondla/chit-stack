using ChitStack.Application.Features.CustomerPortal.Queries.GetMyChits;
using ChitStack.Application.Features.CustomerPortal.Queries.GetMyAuctions;
using ChitStack.Application.Features.CustomerPortal.Queries.GetMyPayments;
using ChitStack.Application.Features.CustomerPortal.Queries.GetDashboard;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitStack.API.Controllers;

[Authorize(Roles = "Subscriber")]
[ApiController]
[Route("api/[controller]")]
public class CustomerController : ControllerBase
{
    private readonly IMediator _mediator;

    public CustomerController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("whoami")]
    [AllowAnonymous] // Test if authentication itself is working
    public IActionResult WhoAmI()
    {
        var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
        return Ok(new { 
            IsAuthenticated = User?.Identity?.IsAuthenticated,
            Name = User?.Identity?.Name,
            AuthenticationType = User?.Identity?.AuthenticationType,
            Claims = claims 
        });
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult> GetDashboard()
    {
        try 
        {
            var result = await _mediator.Send(new GetCustomerDashboardQuery());
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] GetDashboard: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("my-chits")]
    public async Task<ActionResult> GetMyChits()
    {
        try 
        {
            var result = await _mediator.Send(new GetMyChitsQuery());
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] GetMyChits: {ex.Message}");
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("my-auctions")]
    public async Task<ActionResult> GetMyAuctions()
    {
        try 
        {
            var result = await _mediator.Send(new GetMyAuctionsQuery());
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] GetMyAuctions: {ex.Message}");
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("my-payments")]
    public async Task<ActionResult> GetMyPayments()
    {
        try 
        {
            var result = await _mediator.Send(new GetMyPaymentsQuery());
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] GetMyPayments: {ex.Message}");
            return StatusCode(500, ex.Message);
        }
    }
}
