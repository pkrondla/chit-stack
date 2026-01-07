using ChitLedger.Application.Features.CustomerPortal.Queries.GetDashboard;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

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

    [HttpGet("dashboard")]
    public async Task<ActionResult<Result<CustomerDashboardDto>>> GetDashboard()
    {
        return Ok(await _mediator.Send(new GetCustomerDashboardQuery()));
    }
}
