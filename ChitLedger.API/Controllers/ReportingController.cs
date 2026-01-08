using ChitLedger.Application.Features.Reporting.Queries.GetAccountHeads;
using ChitLedger.Application.Features.Reporting.Queries.GetDayBook;
using ChitLedger.Application.Features.Reporting.Queries.GetLedger;
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
    public async Task<ActionResult<Result<List<DayBookEntryDto>>>> GetDayBook([FromQuery] DateTime date, [FromQuery] DateTime? endDate)
    {
        return Ok(await _mediator.Send(new GetDayBookQuery { Date = date, EndDate = endDate }));
    }

    [HttpGet("ledger/{accountHeadId}")]
    public async Task<ActionResult<Result<List<LedgerEntryDto>>>> GetLedger(int accountHeadId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        return Ok(await _mediator.Send(new GetLedgerQuery 
        { 
            AccountHeadId = accountHeadId, 
            StartDate = startDate, 
            EndDate = endDate 
        }));
    }

    [HttpGet("accounts")]
    public async Task<ActionResult<Result<List<AccountHeadDto>>>> GetAccountHeads()
    {
        return Ok(await _mediator.Send(new GetAccountHeadsQuery()));
    }
}
