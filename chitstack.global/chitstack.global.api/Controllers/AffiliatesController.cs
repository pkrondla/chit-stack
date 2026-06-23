using ChitStack.Application.Features.Affiliates.Commands.AdminAddAffiliate;
using ChitStack.Application.Features.Affiliates.Commands.AffiliateLogin;
using ChitStack.Application.Features.Affiliates.Commands.ApproveAffiliate;
using ChitStack.Application.Features.Affiliates.Commands.RecordAffiliatePayout;
using ChitStack.Application.Features.Affiliates.Commands.RegisterAffiliate;
using ChitStack.Application.Features.Affiliates.Commands.UpdateAffiliateCommission;
using ChitStack.Application.Features.Affiliates.Queries.GetAffiliateCommissions;
using ChitStack.Application.Features.Affiliates.Queries.GetAffiliatePayouts;
using ChitStack.Application.Features.Affiliates.Queries.GetAffiliateProfile;
using ChitStack.Application.Features.Affiliates.Queries.GetAffiliates;
using ChitStack.Application.Features.Affiliates.Queries.GetAffiliateTenants;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitStack.Global.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AffiliatesController : ControllerBase
{
    private readonly IMediator _mediator;

    public AffiliatesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ── Public endpoints ──────────────────────────────────────────────────────

    /// <summary>Public — affiliate self-registration.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<RegisterAffiliateResponse>>> Register(RegisterAffiliateCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>Public — affiliate login, returns JWT with Scope=Affiliate.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<AffiliateLoginResponse>>> Login(AffiliateLoginCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return Unauthorized(result);
        return Ok(result);
    }

    // ── Affiliate self-service endpoints ─────────────────────────────────────

    /// <summary>Affiliate — own profile and earnings summary.</summary>
    [HttpGet("me")]
    [Authorize(Policy = "Affiliate")]
    public async Task<ActionResult<Result<AffiliateProfileDto>>> GetProfile()
    {
        var affiliateId = GetAffiliateId();
        if (affiliateId is null) return Unauthorized();
        return Ok(await _mediator.Send(new GetAffiliateProfileQuery { AffiliateId = affiliateId.Value }));
    }

    /// <summary>Affiliate — list own commissions.</summary>
    [HttpGet("me/commissions")]
    [Authorize(Policy = "Affiliate")]
    public async Task<ActionResult<Result<List<AffiliateCommissionDto>>>> GetMyCommissions([FromQuery] string? status)
    {
        var affiliateId = GetAffiliateId();
        if (affiliateId is null) return Unauthorized();
        return Ok(await _mediator.Send(new GetAffiliateCommissionsQuery { AffiliateId = affiliateId.Value, Status = status }));
    }

    /// <summary>Affiliate — list own payouts.</summary>
    [HttpGet("me/payouts")]
    [Authorize(Policy = "Affiliate")]
    public async Task<ActionResult<Result<List<AffiliatePayoutDto>>>> GetMyPayouts()
    {
        var affiliateId = GetAffiliateId();
        if (affiliateId is null) return Unauthorized();
        return Ok(await _mediator.Send(new GetAffiliatePayoutsQuery { AffiliateId = affiliateId.Value }));
    }

    /// <summary>Affiliate — list tenants referred by this affiliate.</summary>
    [HttpGet("me/tenants")]
    [Authorize(Policy = "Affiliate")]
    public async Task<ActionResult<Result<List<AffiliateTenantDto>>>> GetMyTenants()
    {
        var affiliateId = GetAffiliateId();
        if (affiliateId is null) return Unauthorized();
        return Ok(await _mediator.Send(new GetAffiliateTenantsQuery { AffiliateId = affiliateId.Value }));
    }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    /// <summary>Admin — list all affiliates, optionally filtered by approval status.</summary>
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<List<AffiliateListDto>>>> GetAll([FromQuery] bool? isApproved)
    {
        return Ok(await _mediator.Send(new GetAffiliatesQuery { IsApproved = isApproved }));
    }

    /// <summary>Admin — add a new affiliate directly (auto-approved).</summary>
    [HttpPost("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<AdminAddAffiliateResponse>>> AdminAdd(AdminAddAffiliateCommand command)
    {
        command.AddedBy = User.Identity?.Name ?? "Admin";
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>Admin — approve or suspend an affiliate.</summary>
    [HttpPost("admin/{id:int}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<bool>>> Approve(int id, [FromBody] ApproveAffiliateCommand command)
    {
        command.AffiliateId = id;
        command.ApprovedBy = User.Identity?.Name ?? "Admin";
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>Admin — update affiliate details or commission override.</summary>
    [HttpPut("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<bool>>> Update(int id, UpdateAffiliateCommand command)
    {
        command.AffiliateId = id;
        command.UpdatedBy = User.Identity?.Name ?? "Admin";
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>Admin — list commissions for a specific affiliate.</summary>
    [HttpGet("admin/{id:int}/commissions")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<List<AffiliateCommissionDto>>>> GetCommissions(int id, [FromQuery] string? status)
    {
        return Ok(await _mediator.Send(new GetAffiliateCommissionsQuery { AffiliateId = id, Status = status }));
    }

    /// <summary>Admin — record a payout to an affiliate and mark commissions as paid.</summary>
    [HttpPost("admin/{id:int}/payouts")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<int>>> RecordPayout(int id, RecordAffiliatePayoutCommand command)
    {
        command.AffiliateId = id;
        command.CreatedBy = User.Identity?.Name ?? "Admin";
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>Admin — list payouts for a specific affiliate.</summary>
    [HttpGet("admin/{id:int}/payouts")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<List<AffiliatePayoutDto>>>> GetPayouts(int id)
    {
        return Ok(await _mediator.Send(new GetAffiliatePayoutsQuery { AffiliateId = id }));
    }

    /// <summary>Admin — all commissions across all affiliates.</summary>
    [HttpGet("admin/commissions")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<List<AffiliateCommissionDto>>>> GetAllCommissions([FromQuery] string? status)
    {
        return Ok(await _mediator.Send(new GetAffiliateCommissionsQuery { AffiliateId = null, Status = status }));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private int? GetAffiliateId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "AffiliateId");
        return int.TryParse(claim?.Value, out var id) ? id : null;
    }
}
