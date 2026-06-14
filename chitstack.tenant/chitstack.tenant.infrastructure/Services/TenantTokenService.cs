using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ChitStack.Infrastructure.Tenant.Services;

public class TenantTokenService : ITenantTokenService
{
    private readonly IConfiguration _configuration;

    public TenantTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user, int tenantId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "super_secret_key_12345_must_be_long_enough"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("TenantId", tenantId.ToString()),
            new Claim(ClaimTypes.Role, user.Role.Trim()),
            new Claim("role", user.Role.Trim()),
            new Claim("FullName", user.FullName),
            new Claim("MemberId", user.MemberId?.ToString() ?? string.Empty)
        };

        // Add trial claims when user is on the demo stamp (TrialEndDate is set)
        if (user.TrialEndDate.HasValue)
        {
            claims.Add(new Claim("TrialEndDate", user.TrialEndDate.Value.ToString("O")));
            claims.Add(new Claim("SubscriptionStatus", "DemoAccess"));
        }

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "ChitStack",
            audience: _configuration["Jwt:Audience"] ?? "ChitStackApp",
            claims: claims,
            expires: DateTime.Now.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

}
