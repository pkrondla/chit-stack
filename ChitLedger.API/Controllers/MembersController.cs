using ChitLedger.Application.Features.Members.Commands.EnablePortalAccess;
using ChitLedger.Application.Features.Members.Commands.CreateMember;
using ChitLedger.Application.Features.Members.Queries.GetMembers;
using ChitLedger.Application.Features.Members.Queries.GetMemberById;
using ChitLedger.Application.Features.Members.Queries.GetMemberDues;
using ChitLedger.Application.Features.Tickets.Commands.AllocateTicket;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ChitLedger.API.Controllers;

[Authorize(Roles = "Admin,Manager,Staff,Agent")]
[ApiController]
[Route("api/[controller]")]
public class MembersController : ControllerBase
{
    private readonly IMediator _mediator;

    public MembersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<Result<List<MemberDto>>>> Get()
    {
        return Ok(await _mediator.Send(new GetMembersQuery()));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Result<MemberDto>>> GetInternalMemberDetails(int id)
    {
        var result = await _mediator.Send(new GetMemberByIdQuery { Id = id });
        if (!result.Succeeded) return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Result<int>>> Create([FromForm] CreateMemberRequest request, [FromServices] IFileStorageService fileStorage)
    {
        var command = new CreateMemberCommand
        {
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            Email = request.Email,
            PanNumber = request.PanNumber,
            AadhaarNumber = request.AadhaarNumber,
            Address = request.Address
        };

        if (request.PanDocument != null)
        {
            using var stream = request.PanDocument.OpenReadStream();
            command.PanDocumentUrl = await fileStorage.SaveFileAsync(stream, request.PanDocument.FileName, "kyc-docs");
        }

        if (request.AadhaarDocument != null)
        {
            using var stream = request.AadhaarDocument.OpenReadStream();
            command.AadhaarDocumentUrl = await fileStorage.SaveFileAsync(stream, request.AadhaarDocument.FileName, "kyc-docs");
        }

        if (request.Photo != null)
        {
            using var stream = request.Photo.OpenReadStream();
            command.PhotoUrl = await fileStorage.SaveFileAsync(stream, request.Photo.FileName, "member-photos");
        }

        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Result<int>>> Update(int id, [FromForm] UpdateMemberRequest request, [FromServices] IFileStorageService fileStorage)
    {
        var command = new ChitLedger.Application.Features.Members.Commands.UpdateMember.UpdateMemberCommand
        {
            Id = id,
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            Email = request.Email,
            PanNumber = request.PanNumber,
            AadhaarNumber = request.AadhaarNumber,
            Address = request.Address
        };

        if (request.PanDocument != null)
        {
            using var stream = request.PanDocument.OpenReadStream();
            command.PanDocumentUrl = await fileStorage.SaveFileAsync(stream, request.PanDocument.FileName, "kyc-docs");
        }

        if (request.AadhaarDocument != null)
        {
            using var stream = request.AadhaarDocument.OpenReadStream();
            command.AadhaarDocumentUrl = await fileStorage.SaveFileAsync(stream, request.AadhaarDocument.FileName, "kyc-docs");
        }

        if (request.Photo != null)
        {
            using var stream = request.Photo.OpenReadStream();
            command.PhotoUrl = await fileStorage.SaveFileAsync(stream, request.Photo.FileName, "member-photos");
        }

        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("allocate-ticket")]
    public async Task<ActionResult<Result<List<int>>>> AllocateTicket(AllocateTicketCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/enable-portal")]
    public async Task<ActionResult<Result<int>>> EnablePortalAccess(int id)
    {
        return Ok(await _mediator.Send(new EnablePortalAccessCommand { MemberId = id }));
    }

    [HttpGet("{id}/dues")]
    public async Task<ActionResult<Result<MemberDuesDto>>> GetDues(int id)
    {
        return Ok(await _mediator.Send(new GetMemberDuesQuery { MemberId = id }));
    }
}

public class CreateMemberRequest
{
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? PanNumber { get; set; }
    public IFormFile? PanDocument { get; set; }
    public string? AadhaarNumber { get; set; }
    public IFormFile? AadhaarDocument { get; set; }
    public IFormFile? Photo { get; set; }
}

public class UpdateMemberRequest : CreateMemberRequest
{
}
