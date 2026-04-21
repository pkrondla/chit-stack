using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ChitStack.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ChitStack.Infrastructure.Global.Services;

public class GlobalTokenService : IGlobalTokenService
{
    private readonly IConfiguration _configuration;

    public GlobalTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(ChitStack.Domain.Global.GlobalUser user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "super_secret_key_12345_must_be_long_enough"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var role = (user.Role ?? string.Empty).Trim();
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("TenantId", user.TenantId.ToString()),
            new Claim(ClaimTypes.Role, string.IsNullOrEmpty(role) ? "Admin" : role),
            new Claim("role", string.IsNullOrEmpty(role) ? "Admin" : role),
            new Claim("FullName", user.FullName),
            new Claim("Scope", "GlobalAdmin")
        };

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
