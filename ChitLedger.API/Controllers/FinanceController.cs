using ChitLedger.Application.Features.Financials.Commands.CalculatePenalties;
using ChitLedger.Application.Features.Financials.Commands.DisbursePayment;
using ChitLedger.Application.Features.Financials.Commands.GenerateDemands;
using ChitLedger.Application.Features.Financials.Commands.RecordPayment;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

[Authorize(Roles = "Admin,Manager")]
[ApiController]
[Route("api/[controller]")]
public class FinanceController : ControllerBase
{
    private readonly IMediator _mediator;

    public FinanceController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("generate-demands")]
    public async Task<ActionResult<Result<int>>> GenerateDemands(GenerateDemandsCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("pay")]
    public async Task<ActionResult<Result<int>>> Pay(RecordPaymentCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("payout")]
    public async Task<ActionResult<Result<int>>> Payout(DisbursePaymentCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("calc-penalties")]
    public async Task<ActionResult<Result<int>>> CalculatePenalties()
    {
        return Ok(await _mediator.Send(new CalculatePenaltiesCommand()));
    }
}
