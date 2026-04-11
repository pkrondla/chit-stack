using ChitStack.Application.Features.Reporting.Commands.UpsertAccount;
using ChitStack.Application.Features.Reporting.Queries.GetAccountHeads;
using ChitStack.Application.Features.Reporting.Queries.GetBranches;
using ChitStack.Application.Features.Reporting.Queries.GetDayBook;
using ChitStack.Application.Features.Reporting.Queries.GetLedger;
using ChitStack.Application.Features.Reporting.Queries.GetProfitAndLoss;
using ChitStack.Application.Features.Reporting.Queries.GetPassbook;
using ChitStack.Application.Features.Reporting.Queries.GetTrialBalance;
using ChitStack.Application.Features.Reporting.Queries.GetBalanceSheet;
using ChitStack.Application.Features.Reporting.Queries.GetAuditorSummary;
using ChitStack.Application.Features.Reporting.Queries.GetArrearsReport;
using ChitStack.Application.Features.Reporting.Queries.GetCollectionSummary;
using ChitStack.Application.Features.Reporting.Queries.GetCashBook;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;

namespace ChitStack.API.Controllers;

[Authorize(Roles = "Admin,Manager,Staff")]
[ApiController]
[Route("api/[controller]")]
public class ReportingController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IPdfService _pdfService;
    private readonly IApplicationDbContext _context;

    public ReportingController(IMediator mediator, IPdfService pdfService, IApplicationDbContext context)
    {
        _mediator = mediator;
        _pdfService = pdfService;
        _context = context;
    }

    [HttpGet("daybook")]
    public async Task<ActionResult<Result<List<DayBookEntryDto>>>> GetDayBook([FromQuery] DateTime? date, [FromQuery] DateTime? endDate, [FromQuery] int? limit, [FromQuery] int? branchId)
    {
        return Ok(await _mediator.Send(new GetDayBookQuery { Date = date, EndDate = endDate, Limit = limit, BranchId = branchId }));
    }

    [HttpGet("ledger/{accountHeadId}")]
    public async Task<ActionResult<Result<List<LedgerEntryDto>>>> GetLedger(int accountHeadId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] bool unreconciledOnly = false, [FromQuery] bool reconciledOnly = false, [FromQuery] int? branchId = null, [FromQuery] int? memberId = null, [FromQuery] int? chitGroupId = null)
    {
        return Ok(await _mediator.Send(new GetLedgerQuery 
        { 
            AccountHeadId = accountHeadId, 
            MemberId = memberId,
            ChitGroupId = chitGroupId,
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

    // =====================================================================
    // NEW REPORTS (MANAGEMENT & STATUTORY FORM IX)
    // =====================================================================

    [HttpGet("arrears")]
    public async Task<ActionResult<Result<List<ArrearsReportDto>>>> GetArrearsReport([FromQuery] int? branchId, [FromQuery] int? chitGroupId, [FromQuery] int? memberId, [FromQuery] int? routeId)
    {
        return Ok(await _mediator.Send(new GetArrearsReportQuery { BranchId = branchId, ChitGroupId = chitGroupId, MemberId = memberId, RouteId = routeId }));
    }

    [HttpGet("arrears/pdf")]
    public async Task<IActionResult> GetArrearsReportPdf([FromQuery] int? branchId, [FromQuery] int? chitGroupId, [FromQuery] int? memberId, [FromQuery] int? routeId)
    {
        var result = await _mediator.Send(new GetArrearsReportQuery { BranchId = branchId, ChitGroupId = chitGroupId, MemberId = memberId, RouteId = routeId });
        if (!result.Succeeded || result.Data == null) return BadRequest(result.Errors.FirstOrDefault());
        
        var settings = await _context.TenantSettings.FirstOrDefaultAsync();
        var pdf = _pdfService.GenerateArrearsReport(result.Data, settings);
        return File(pdf, "application/pdf", $"Arrears_Report_{DateTime.Now:yyyyMMdd}.pdf");
    }

    [HttpGet("collection-summary")]
    public async Task<ActionResult<Result<CollectionSummaryDto>>> GetCollectionSummary([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int? branchId)
    {
        return Ok(await _mediator.Send(new GetCollectionSummaryQuery { FromDate = from, ToDate = to, BranchId = branchId }));
    }

    [HttpGet("collection-summary/pdf")]
    public async Task<IActionResult> GetCollectionSummaryPdf([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int? branchId)
    {
        var result = await _mediator.Send(new GetCollectionSummaryQuery { FromDate = from, ToDate = to, BranchId = branchId });
        if (!result.Succeeded || result.Data == null) return BadRequest(result.Errors.FirstOrDefault());

        var settings = await _context.TenantSettings.FirstOrDefaultAsync();
        var pdf = _pdfService.GenerateCollectionSummary(result.Data, from, to, settings);
        return File(pdf, "application/pdf", $"Collection_Summary_{from:yyyyMMdd}_to_{to:yyyyMMdd}.pdf");
    }

    [HttpGet("cash-book")]
    public async Task<ActionResult<Result<List<CashBookEntryDto>>>> GetCashBook([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int? branchId)
    {
        return Ok(await _mediator.Send(new GetCashBookQuery { FromDate = from, ToDate = to, BranchId = branchId }));
    }

    [HttpGet("cash-book/pdf")]
    public async Task<IActionResult> GetCashBookPdf([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int? branchId)
    {
        // For Form IX (Cash Book) we need the JournalEntryLines with their parent JournalEntry
        var start = from.Date;
        var end = to.Date.AddDays(1).AddTicks(-1);

        var query = _context.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Include(l => l.AccountHead)
            .Where(l => l.AccountHead.SystemRole == "Cash" || l.AccountHead.SystemRole == "Bank")
            .Where(l => l.JournalEntry.EntryDate >= start && l.JournalEntry.EntryDate <= end);

        if (branchId.HasValue) query = query.Where(l => l.BranchId == branchId);

        var entries = await query.OrderBy(l => l.JournalEntry.EntryDate).ToListAsync();
        var settings = await _context.TenantSettings.FirstOrDefaultAsync();
        
        var pdf = _pdfService.GenerateCashBook(entries, from, to, settings);
        return File(pdf, "application/pdf", $"Form_IX_CashBook_{from:yyyyMMdd}_to_{to:yyyyMMdd}.pdf");
    }
}
