using ChitStack.Application.Features.GlobalUsers.Commands.CreateGlobalUser;
using ChitStack.Application.Features.GlobalUsers.Queries.GetGlobalUsers;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitStack.Global.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<Result<List<GlobalUserDto>>>> GetList()
    {
        return Ok(await _mediator.Send(new GetGlobalUsersQuery()));
    }

    [HttpPost]
    public async Task<ActionResult<Result<int>>> Create(CreateGlobalUserCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }
}
