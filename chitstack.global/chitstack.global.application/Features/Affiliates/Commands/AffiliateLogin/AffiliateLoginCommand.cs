using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Affiliates.Commands.AffiliateLogin;

public class AffiliateLoginCommand : IRequest<Result<AffiliateLoginResponse>>
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AffiliateLoginResponse
{
    public string Token { get; set; } = string.Empty;
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
}

public class AffiliateLoginHandler : IRequestHandler<AffiliateLoginCommand, Result<AffiliateLoginResponse>>
{
    private readonly IGlobalDbContext _context;
    private readonly IGlobalTokenService _tokenService;

    public AffiliateLoginHandler(IGlobalDbContext context, IGlobalTokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<Result<AffiliateLoginResponse>> Handle(
        AffiliateLoginCommand request,
        CancellationToken cancellationToken)
    {
        var affiliate = await _context.Affiliates
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Email == request.Email && a.IsActive, cancellationToken);

        if (affiliate is null || affiliate.PasswordHash != request.Password) // TODO: hash comparison
            return Result<AffiliateLoginResponse>.Failure("Invalid email or password.");

        if (!affiliate.IsApproved)
            return Result<AffiliateLoginResponse>.Failure("Your account is pending admin approval. Please check your email for updates.");

        var token = _tokenService.GenerateAffiliateToken(affiliate);

        return Result<AffiliateLoginResponse>.Success(new AffiliateLoginResponse
        {
            Token = token,
            Id = affiliate.Id,
            Name = affiliate.Name,
            Email = affiliate.Email,
            Code = affiliate.Code,
            CompanyName = affiliate.CompanyName
        });
    }
}
