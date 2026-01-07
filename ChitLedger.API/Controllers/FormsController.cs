using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.API.Controllers;

[Authorize(Roles = "Admin,Manager,Staff")]
[ApiController]
[Route("api/[controller]")]
public class FormsController : ControllerBase
{
    private readonly IPdfService _pdfService;
    private readonly IApplicationDbContext _context;

    public FormsController(IPdfService pdfService, IApplicationDbContext context)
    {
        _pdfService = pdfService;
        _context = context;
    }

    [HttpGet("sanction/{groupId}")]
    public async Task<IActionResult> GetSanctionForm(int groupId)
    {
        var group = await _context.ChitGroups.FindAsync(groupId);
        if (group == null) return NotFound("Chit Group not found");

        var pdfBytes = _pdfService.GenerateSanctionForm(group);
        return File(pdfBytes, "application/pdf", $"Form_I_{group.GroupName}.pdf");
    }

    [HttpGet("minutes/{auctionId}")]
    public async Task<IActionResult> GetMinutesForm(int auctionId)
    {
        var auction = await _context.Auctions
            .Include(a => a.ChitGroup)
            .ThenInclude(g => g.Tickets)
            .FirstOrDefaultAsync(a => a.Id == auctionId);
            
        if (auction == null) return NotFound("Auction not found");

        var pdfBytes = _pdfService.GenerateMinutesForm(auction);
        return File(pdfBytes, "application/pdf", $"Form_VIII_Auction_{auctionId}.pdf");
    }

    [HttpGet("notice/{demandId}")]
    public async Task<IActionResult> GetDemandNotice(int demandId)
    {
        var demand = await _context.Demands.FirstOrDefaultAsync(d => d.Id == demandId);
        if (demand == null) return NotFound("Demand not found");
        
        var ticket = await _context.Tickets
            .Include(t => t.Member)
            .Include(t => t.ChitGroup)
            .FirstOrDefaultAsync(t => t.Id == demand.TicketId);

        if (ticket == null) return NotFound("Ticket details not found");

        var pdfBytes = _pdfService.GenerateDemandNotice(demand, ticket.Member, ticket.ChitGroup);
        return File(pdfBytes, "application/pdf", $"Notice_Demand_{demandId}.pdf");
    }

    [HttpGet("agreement/{groupId}")]
    public async Task<IActionResult> GetAgreementForm(int groupId)
    {
        var group = await _context.ChitGroups
            .Include(g => g.Tickets)
            .ThenInclude(t => t.Member)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group == null) return NotFound("Group not found");

        var pdfBytes = _pdfService.GenerateAgreementForm(group);
        return File(pdfBytes, "application/pdf", $"Form_II_{group.GroupName}.pdf");
    }

    [HttpGet("balancesheet")]
    public async Task<IActionResult> GetBalanceSheet()
    {
        // For Form XI, we fetch all accounts
        // Refinement: Ideally we should calculate balances from JournalEntries
        var accounts = await _context.AccountHeads.ToListAsync();
        
        var pdfBytes = _pdfService.GenerateBalanceSheet(accounts);
        return File(pdfBytes, "application/pdf", $"Form_XI_BalanceSheet.pdf");
    }
}
