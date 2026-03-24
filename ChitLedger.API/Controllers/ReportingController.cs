using ChitLedger.Application.Features.Reporting.Commands.UpsertAccount;
using ChitLedger.Application.Features.Reporting.Queries.GetAccountHeads;
using ChitLedger.Application.Features.Reporting.Queries.GetBranches;
using ChitLedger.Application.Features.Reporting.Queries.GetDayBook;
using ChitLedger.Application.Features.Reporting.Queries.GetLedger;
using ChitLedger.Application.Features.Reporting.Queries.GetProfitAndLoss;
using ChitLedger.Application.Features.Reporting.Queries.GetPassbook;
using ChitLedger.Application.Features.Reporting.Queries.GetTrialBalance;
using ChitLedger.Application.Features.Reporting.Queries.GetBalanceSheet;
using ChitLedger.Application.Features.Reporting.Queries.GetAuditorSummary;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

[Authorize(Roles = "Admin,Manager,Staff")]
[ApiController]
[Route("api/[controller]")]
public class ReportingController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReportingController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("daybook")]
    public async Task<ActionResult<Result<List<DayBookEntryDto>>>> GetDayBook([FromQuery] DateTime? date, [FromQuery] DateTime? endDate, [FromQuery] int? limit, [FromQuery] int? branchId)
    {
        return Ok(await _mediator.Send(new GetDayBookQuery { Date = date, EndDate = endDate, Limit = limit, BranchId = branchId }));
    }

    [HttpGet("ledger/{accountHeadId}")]
    public async Task<ActionResult<Result<List<LedgerEntryDto>>>> GetLedger(int accountHeadId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] bool unreconciledOnly = false, [FromQuery] bool reconciledOnly = false, [FromQuery] int? branchId = null)
    {
        return Ok(await _mediator.Send(new GetLedgerQuery 
        { 
            AccountHeadId = accountHeadId, 
            StartDate = startDate, 
            EndDate = endDate,
            UnreconciledOnly = unreconciledOnly,
            ReconciledOnly = reconciledOnly,
            BranchId = branchId
        }));
    }

    [HttpGet("accounts")]
    public async Task<ActionResult<Result<List<AccountHeadDto>>>> GetAccountHeads()
    {
        return Ok(await _mediator.Send(new GetAccountHeadsQuery()));
    }

    [HttpGet("branches")]
    public async Task<ActionResult<Result<List<BranchDto>>>> GetBranches()
    {
        return Ok(await _mediator.Send(new GetBranchesQuery()));
    }

    [HttpPost("accounts")]
    public async Task<ActionResult<Result<int>>> CreateAccount(UpsertAccountCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("accounts/{id}")]
    public async Task<ActionResult<Result<int>>> UpdateAccount(int id, UpsertAccountCommand command)
    {
        command.Id = id;
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("trial-balance")]
    public async Task<ActionResult<Result<TrialBalanceDto>>> GetTrialBalance([FromQuery] DateTime asOfDate, [FromQuery] int? branchId)
    {
        return Ok(await _mediator.Send(new GetTrialBalanceQuery { AsOfDate = asOfDate, BranchId = branchId }));
    }

    [HttpGet("profit-loss")]
    public async Task<ActionResult<Result<ProfitAndLossDto>>> GetProfitLoss([FromQuery] DateTime start, [FromQuery] DateTime end, [FromQuery] int? branchId)
    {
        return Ok(await _mediator.Send(new GetProfitAndLossQuery { StartDate = start, EndDate = end, BranchId = branchId }));
    }

    [HttpGet("balance-sheet")]
    public async Task<ActionResult<Result<BalanceSheetDto>>> GetBalanceSheet([FromQuery] DateTime asOfDate, [FromQuery] int? branchId)
    {
        return Ok(await _mediator.Send(new GetBalanceSheetQuery { AsOfDate = asOfDate, BranchId = branchId }));
    }

    [HttpGet("auditor-summary")]
    public async Task<ActionResult<Result<AuditorSummaryDto>>> GetAuditorSummary()
    {
        return Ok(await _mediator.Send(new GetAuditorSummaryQuery()));
    }

    [HttpGet("passbook/{ticketId}")]
    public async Task<ActionResult<Result<PassbookDto>>> GetPassbook(int ticketId)
    {
        return Ok(await _mediator.Send(new GetPassbookQuery { TicketId = ticketId }));
    }
}
