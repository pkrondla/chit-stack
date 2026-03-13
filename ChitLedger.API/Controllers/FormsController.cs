using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Application.Features.Forms.Queries.GetSubscriberAgreement;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;

namespace ChitLedger.API.Controllers;

[Authorize(Roles = "Admin,Manager,Staff")]
[ApiController]
[Route("api/[controller]")]
public class FormsController : ControllerBase
{
    private readonly IPdfService _pdfService;
    private readonly IApplicationDbContext _context;
    private readonly IMediator _mediator;

    public FormsController(IPdfService pdfService, IApplicationDbContext context, IMediator mediator)
    {
        _pdfService = pdfService;
        _context = context;
        _mediator = mediator;
    }

    // Helper: load tenant settings (returns null if not configured yet)
    private Task<TenantSettings?> GetSettings() =>
        _context.TenantSettings.FirstOrDefaultAsync();

    // Helper: load a group with its tickets and members
    private Task<ChitGroup?> GetGroup(int groupId) =>
        _context.ChitGroups.Include(g => g.Tickets).ThenInclude(t => t.Member).FirstOrDefaultAsync(g => g.Id == groupId);

    // =====================================================================
    // STATUTORY FORMS — Individual downloads
    // =====================================================================

    /// <summary>Form I — Application for Prior Sanction (Section 4)</summary>
    [HttpGet("sanction/{groupId}")]
    public async Task<IActionResult> GetSanctionForm(int groupId)
    {
        var group = await GetGroup(groupId);
        if (group == null) return NotFound("Chit Group not found");
        var settings = await GetSettings();
        var pdf = _pdfService.GenerateSanctionForm(group, settings);
        return File(pdf, "application/pdf", $"Form_I_Sanction_{group.GroupName}.pdf");
    }

    /// <summary>Form II — Application for Registration of Chit (Section 8 / Rule 5)</summary>
    [HttpGet("agreement/{groupId}")]
    public async Task<IActionResult> GetAgreementForm(int groupId)
    {
        var group = await GetGroup(groupId);
        if (group == null) return NotFound("Group not found");
        var settings = await GetSettings();
        var pdf = _pdfService.GenerateAgreementForm(group, settings);
        return File(pdf, "application/pdf", $"Form_II_Registration_{group.GroupName}.pdf");
    }

    /// <summary>Bye-Laws of the Chit Group</summary>
    [HttpGet("byelaws/{groupId}")]
    public async Task<IActionResult> GetByeLaws(int groupId)
    {
        var group = await GetGroup(groupId);
        if (group == null) return NotFound("Group not found");
        var settings = await GetSettings();
        var pdf = _pdfService.GenerateByeLaws(group, settings);
        return File(pdf, "application/pdf", $"ByeLaws_{group.GroupName}.pdf");
    }

    /// <summary>Security Deposit Letter</summary>
    [HttpGet("security-deposit/{groupId}")]
    public async Task<IActionResult> GetSecurityDepositLetter(int groupId)
    {
        var group = await _context.ChitGroups.FindAsync(groupId);
        if (group == null) return NotFound("Group not found");
        var settings = await GetSettings();
        var pdf = _pdfService.GenerateSecurityDepositLetter(group, settings);
        return File(pdf, "application/pdf", $"SecurityDeposit_{group.GroupName}.pdf");
    }

    /// <summary>Form V — Declaration of Full Subscription (Section 9(1))</summary>
    [HttpGet("form-v/{groupId}")]
    public async Task<IActionResult> GetFormV(int groupId)
    {
        var group = await GetGroup(groupId);
        if (group == null) return NotFound("Group not found");
        var settings = await GetSettings();
        var pdf = _pdfService.GenerateFormV(group, settings);
        return File(pdf, "application/pdf", $"Form_V_FullSubscription_{group.GroupName}.pdf");
    }

    /// <summary>Form VI — Certificate of Commencement Request (Section 10)</summary>
    [HttpGet("form-vi/{groupId}")]
    public async Task<IActionResult> GetFormVI(int groupId)
    {
        var group = await _context.ChitGroups.FindAsync(groupId);
        if (group == null) return NotFound("Group not found");
        var settings = await GetSettings();
        var pdf = _pdfService.GenerateFormVI(group, settings);
        return File(pdf, "application/pdf", $"Form_VI_Commencement_{group.GroupName}.pdf");
    }

    /// <summary>Form VII — Agreements Distributed to Subscribers (Section 11)</summary>
    [HttpGet("form-vii/{groupId}")]
    public async Task<IActionResult> GetFormVII(int groupId)
    {
        var group = await GetGroup(groupId);
        if (group == null) return NotFound("Group not found");
        var settings = await GetSettings();
        var pdf = _pdfService.GenerateFormVII(group, settings);
        return File(pdf, "application/pdf", $"Form_VII_AgreementsDistributed_{group.GroupName}.pdf");
    }

    // =====================================================================
    // STATUTORY FORMS — Download ALL as ZIP
    // =====================================================================

    /// <summary>Download all 7 statutory documents as a single ZIP file</summary>
    [HttpGet("statutory/{groupId}")]
    public async Task<IActionResult> GetAllStatutoryForms(int groupId)
    {
        var group = await GetGroup(groupId);
        if (group == null) return NotFound("Chit Group not found");
        var settings = await GetSettings();
        var safeName = group.GroupName.Replace(" ", "_");

        var forms = new (string FileName, byte[] Data)[]
        {
            ($"Form_I_Sanction_{safeName}.pdf",                _pdfService.GenerateSanctionForm(group, settings)),
            ($"Form_II_Registration_{safeName}.pdf",           _pdfService.GenerateAgreementForm(group, settings)),
            ($"ByeLaws_{safeName}.pdf",                        _pdfService.GenerateByeLaws(group, settings)),
            ($"SecurityDepositLetter_{safeName}.pdf",          _pdfService.GenerateSecurityDepositLetter(group, settings)),
            ($"Form_V_FullSubscription_{safeName}.pdf",        _pdfService.GenerateFormV(group, settings)),
            ($"Form_VI_CommencementRequest_{safeName}.pdf",    _pdfService.GenerateFormVI(group, settings)),
            ($"Form_VII_AgreementsDistributed_{safeName}.pdf", _pdfService.GenerateFormVII(group, settings)),
        };

        using var memoryStream = new MemoryStream();
        using (var zip = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var (fileName, data) in forms)
            {
                var entry = zip.CreateEntry(fileName, CompressionLevel.Fastest);
                using var entryStream = entry.Open();
                await entryStream.WriteAsync(data);
            }
        }

        memoryStream.Seek(0, SeekOrigin.Begin);
        return File(memoryStream.ToArray(), "application/zip", $"Statutory_Forms_{safeName}.zip");
    }

    // =====================================================================
    // OPERATIONAL FORMS
    // =====================================================================

    [HttpGet("minutes/{auctionId}")]
    public async Task<IActionResult> GetMinutesForm(int auctionId)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup).ThenInclude(g => g.Tickets)
            .FirstOrDefaultAsync(a => a.Id == auctionId);
        if (auction == null) return NotFound("Auction not found");
        var pdf = _pdfService.GenerateMinutesForm(auction);
        return File(pdf, "application/pdf", $"Form_VIII_Auction_{auctionId}.pdf");
    }

    [HttpGet("notice/{demandId}")]
    public async Task<IActionResult> GetDemandNotice(int demandId)
    {
        var demand = await _context.Demands.FirstOrDefaultAsync(d => d.Id == demandId);
        if (demand == null) return NotFound("Demand not found");
        var ticket = await _context.Tickets
            .Include(t => t.Member).Include(t => t.ChitGroup)
            .FirstOrDefaultAsync(t => t.Id == demand.TicketId);
        if (ticket == null) return NotFound("Ticket details not found");
        var settings = await GetSettings();
        var pdf = _pdfService.GenerateDemandNotice(demand, ticket.Member!, ticket.ChitGroup, settings);
        return File(pdf, "application/pdf", $"Notice_Demand_{demandId}.pdf");
    }

    [HttpGet("receipt/{receiptId}")]
    public async Task<IActionResult> GetReceipt(int receiptId)
    {
        var receipt = await _context.Receipts
            .Include(r => r.Ticket).ThenInclude(t => t.ChitGroup)
            .Include(r => r.Ticket).ThenInclude(t => t.Member)
            .FirstOrDefaultAsync(r => r.Id == receiptId);
        if (receipt == null) return NotFound("Receipt not found");
        var settings = await GetSettings();
        var pdf = _pdfService.GenerateReceipt(receipt, receipt.Ticket.Member!, receipt.Ticket.ChitGroup, settings);
        return File(pdf, "application/pdf", $"Receipt_{receiptId}.pdf");
    }

    [HttpGet("balancesheet")]
    public async Task<IActionResult> GetBalanceSheet()
    {
        var accounts = await _context.AccountHeads.ToListAsync();
        var settings = await GetSettings();
        var pdf = _pdfService.GenerateBalanceSheet(accounts, settings);
        return File(pdf, "application/pdf", "Form_XI_BalanceSheet.pdf");
    }

    [HttpGet("subscriber-agreement/{ticketId}")]
    public async Task<IActionResult> GetSubscriberAgreement(int ticketId)
    {
        var query = new GetSubscriberAgreementQuery { TicketId = ticketId };
        var result = await _mediator.Send(query);
        if (!result.Succeeded || result.Data == null) return BadRequest(result.Errors.FirstOrDefault() ?? "Unknown Error");
        return File(result.Data, "application/pdf", $"Agreement_{ticketId}.pdf");
    }

    [HttpGet("kyc/{memberId}")]
    public async Task<IActionResult> GetKycForm(int memberId)
    {
        var member = await _context.Members.FirstOrDefaultAsync(m => m.Id == memberId);
        if (member == null) return NotFound("Member not found");
        var settings = await GetSettings();
        var pdf = _pdfService.GenerateKycForm(member, settings);
        return File(pdf, "application/pdf", $"KYC_{member.FullName.Replace(" ", "_")}.pdf");
    }
}
