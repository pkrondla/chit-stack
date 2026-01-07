using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Auth.Commands.Login;

public class LoginCommand : IRequest<Result<string>>
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginHandler : IRequestHandler<LoginCommand, Result<string>>
{
    private readonly ITenantService _tenantService;
    private readonly ITokenService _tokenService;
    // We need to access db. In Clean Arch, usually via IApplicationDbContext.
    // But since we are inside Application, we depend on Interface.
    // Let's assume we inject IApplicationDbContext which exposes Users.
    // For now, I'll bypass interface and use a generic IRepository pattern or just standard DI if interfaces were defined.
    // Since I haven't defined IApplicationDbContext yet, I will define it now implicitly or use a service.
    
    // Wait, I should define IApplicationDbContext in Common.Interfaces to decouple Application from Infrastructure.
    private readonly IApplicationDbContext _context;

    public LoginHandler(ITenantService tenantService, ITokenService tokenService, IApplicationDbContext context)
    {
        _tenantService = tenantService;
        _tokenService = tokenService;
        _context = context;
    }

    public async Task<Result<string>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;
        
        // Simple password check (Hash should be used in real app)
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username && u.TenantId == tenantId, cancellationToken);
            
        if (user == null || user.PasswordHash != request.Password) // TODO: Hash check
        {
            return Result<string>.Failure("Invalid credentials");
        }
        
        var token = _tokenService.GenerateToken(user, tenantId);
        return Result<string>.Success(token);
    }
}
