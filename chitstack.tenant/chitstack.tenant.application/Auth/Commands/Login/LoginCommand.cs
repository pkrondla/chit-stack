using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Auth.Commands.Login;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public LoginUserDto User { get; set; } = null!;
    public List<LoginBranchDto> AuthorizedBranches { get; set; } = new();
}

public class LoginUserDto 
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}

public class LoginBranchDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class LoginCommand : IRequest<Result<LoginResponse>>
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? LoginMode { get; set; } // "Password" or "OTP"
    public string? Otp { get; set; }
}

public class LoginHandler : IRequestHandler<LoginCommand, Result<LoginResponse>>
{
    private readonly ITenantService _tenantService;
    private readonly ITenantTokenService _tokenService;
    // We need to access db. In Clean Arch, usually via IApplicationDbContext.
    // But since we are inside Application, we depend on Interface.
    // Let's assume we inject IApplicationDbContext which exposes Users.
    // For now, I'll bypass interface and use a generic IRepository pattern or just standard DI if interfaces were defined.
    // Since I haven't defined IApplicationDbContext yet, I will define it now implicitly or use a service.
    
    // Wait, I should define IApplicationDbContext in Common.Interfaces to decouple Application from Infrastructure.
    private readonly IApplicationDbContext _context;

    public LoginHandler(ITenantService tenantService, ITenantTokenService tokenService, IApplicationDbContext context)
    {
        _tenantService = tenantService;
        _tokenService = tokenService;
        _context = context;
    }

    public async Task<Result<LoginResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;
        
        // Simple password/OTP check (Hash should be used in real app)
        var user = await _context.Users
            .Include(u => u.UserBranches)
            .ThenInclude(ub => ub.Branch)
            .FirstOrDefaultAsync(u => 
                (u.Username == request.Username || u.Email == request.Username) 
                && u.TenantId == tenantId, cancellationToken);
            
        if (user == null)
        {
            return Result<LoginResponse>.Failure($"User '{request.Username}' not found in tenant '{tenantId}'.");
        }

        bool isOtp = string.Equals(request.LoginMode, "OTP", StringComparison.OrdinalIgnoreCase);

        if (isOtp)
        {
            if (request.Otp != "123456") // Mock OTP check
                return Result<LoginResponse>.Failure("Invalid OTP code.");
        }
        else
        {
            if (user.PasswordHash != request.Password) // TODO: Hash check
                return Result<LoginResponse>.Failure("Invalid password.");
        }

        // Trial enforcement — only applies to demo stamp users with TrialEndDate set
        if (user.TrialEndDate.HasValue && user.TrialEndDate.Value < DateTime.UtcNow)
        {
            return Result<LoginResponse>.Failure("TrialExpired");
        }
        
        var token = _tokenService.GenerateToken(user, tenantId);
        
        var response = new LoginResponse
        {
            Token = token,
            User = new LoginUserDto
            {
                Id = user.Id,
                Username = user.Username,
                Role = user.Role,
                FullName = user.FullName
            },
            AuthorizedBranches = user.UserBranches.Select(ub => new LoginBranchDto
            {
                Id = ub.Branch!.Id,
                Name = ub.Branch.Name,
                Code = ub.Branch.Code
            }).ToList()
        };
        
        return Result<LoginResponse>.Success(response);
    }
}
