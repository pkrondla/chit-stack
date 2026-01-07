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
}
