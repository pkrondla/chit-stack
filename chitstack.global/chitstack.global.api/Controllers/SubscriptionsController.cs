using ChitStack.Application.Features.Subscriptions.Queries.GetSubscriptionRenewals;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitStack.Global.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubscriptionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SubscriptionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Returns annual subscription items (AMC, Cloud Infrastructure) for a tenant,
    /// including expiry status. Called directly by the tenant web dashboard.
    /// </summary>
    [HttpGet("renewals")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<List<SubscriptionRenewalDto>>>> GetRenewals(
        [FromQuery] string email,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetSubscriptionRenewalsQuery { ContactEmail = email }, ct);
        return Ok(result);
    }
}
