using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Global;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.GlobalUsers.Commands.CreateGlobalUser;

public class CreateGlobalUserCommand : IRequest<Result<int>>
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
    public int TenantId { get; set; } = 1; // Always 1 for Global DB Default Tenant
}

public class CreateGlobalUserHandler : IRequestHandler<CreateGlobalUserCommand, Result<int>>
{
    private readonly IGlobalDbContext _context;

    public CreateGlobalUserHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(CreateGlobalUserCommand request, CancellationToken cancellationToken)
    {
        if (await _context.Users.AnyAsync(u => u.Username == request.Username, cancellationToken))
            return Result<int>.Failure("Username already exists.");

        var user = new GlobalUser
        {
            Username = request.Username,
            PasswordHash = request.Password, // TODO: Implement hashing
            Email = request.Email,
            FullName = request.FullName,
            Role = request.Role,
            TenantId = request.TenantId
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(user.Id);
    }
}
