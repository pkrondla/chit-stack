using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Auth.Commands.GlobalLogin;

public class GlobalLoginCommand : IRequest<Result<string>>
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class GlobalLoginHandler : IRequestHandler<GlobalLoginCommand, Result<string>>
{
    private readonly IGlobalDbContext _context;
    private readonly IGlobalTokenService _tokenService;

    public GlobalLoginHandler(IGlobalDbContext context, IGlobalTokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<Result<string>> Handle(GlobalLoginCommand request, CancellationToken cancellationToken)
    {
        // Global Admins always reside in the root tenant.
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username == request.Username && u.IsActive, cancellationToken);

        if (user == null || user.PasswordHash != request.Password) // TODO: hash comparison
        {
            return Result<string>.Failure("Invalid credentials");
        }

        var token = _tokenService.GenerateToken(user);
        return Result<string>.Success(token);
    }
}
