using ChitLedger.Application.Features.Financials.Commands.CalculatePenalties;
using ChitLedger.Application.Features.Financials.Commands.DisbursePayment;
using ChitLedger.Application.Features.Financials.Commands.GenerateDemands;
using ChitLedger.Application.Features.Finance.Queries.GetGstr1Report;
using ChitLedger.Application.Features.Financials.Commands.RecordPayment;
using ChitLedger.Application.Features.Financials.Commands.HandleChequeBounce;
using ChitLedger.Application.Features.Financials.Commands.ReconcileTransactions;
using ChitLedger.Application.Features.Financials.Commands.CreateJournalEntry;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FinanceController : ControllerBase
{
    private readonly IMediator _mediator;

    public FinanceController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("generate-demands")]
    public async Task<ActionResult<Result<int>>> GenerateDemands(GenerateDemandsCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager,Agent")]
    [HttpPost("pay")]
    public async Task<ActionResult<Result<int>>> Pay(RecordPaymentCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("payout")]
    public async Task<ActionResult<Result<int>>> Payout(DisbursePaymentCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("calc-penalties")]
    public async Task<ActionResult<Result<int>>> CalculatePenalties()
    {
        return Ok(await _mediator.Send(new CalculatePenaltiesCommand()));
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("cheque-bounce")]
    public async Task<ActionResult<Result<int>>> ChequeBounce(HandleChequeBounceCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("reconcile")]
    public async Task<ActionResult<Result<int>>> Reconcile(ReconcileTransactionsCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("journal")]
    public async Task<ActionResult<Result<int>>> CreateJournal(CreateJournalEntryCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpGet("gstr1")]
    public async Task<IActionResult> GetGstr1([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int? branchId)
    {
        var result = await _mediator.Send(new GetGstr1ReportQuery { FromDate = from, ToDate = to, BranchId = branchId });
        if (!result.Succeeded) return BadRequest(result);
        
        return File(result.Data, "text/csv", $"GSTR1_{from:yyyyMMdd}_{to:yyyyMMdd}.csv");
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpGet("gstr1-data")]
    public async Task<ActionResult<Result<List<Gstr1EntryDto>>>> GetGstr1Data([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int? branchId)
    {
        return Ok(await _mediator.Send(new GetGstr1DataQuery { FromDate = from, ToDate = to, BranchId = branchId }));
    }
}
