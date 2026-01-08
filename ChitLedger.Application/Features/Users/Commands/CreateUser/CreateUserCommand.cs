using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Users.Commands.CreateUser;

public class CreateUserCommand : IRequest<Result<int>>
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "Staff"; // Admin, Manager, Staff
}

public class CreateUserHandler : IRequestHandler<CreateUserCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public CreateUserHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        // 1. Check if username exists
        var exists = await _context.Users.AnyAsync(u => u.Username == request.Username, cancellationToken);
        if (exists) return Result<int>.Failure("Username already exists.");

        // 2. Create User
        // Note: Password should be hashed. Using plain text for MVP consistency with LoginHandler.
        var user = new User
        {
            Username = request.Username,
            PasswordHash = request.Password, 
            Email = request.Email,
            FullName = request.FullName,
            Role = request.Role
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(user.Id);
    }
}
