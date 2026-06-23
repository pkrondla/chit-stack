using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Global;
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

    public string GenerateToken(GlobalUser user)
    {
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

        return BuildToken(claims, days: 7);
    }

    public string GenerateAffiliateToken(Affiliate affiliate)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, affiliate.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, affiliate.Email),
            new Claim("AffiliateId", affiliate.Id.ToString()),
            new Claim("AffiliateCode", affiliate.Code),
            new Claim("FullName", affiliate.Name),
            new Claim(ClaimTypes.Role, "Affiliate"),
            new Claim("role", "Affiliate"),
            new Claim("Scope", "Affiliate")
        };

        return BuildToken(claims, days: 7);
    }

    private string BuildToken(IEnumerable<Claim> claims, int days)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Key"] ?? "super_secret_key_12345_must_be_long_enough"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "ChitStack",
            audience: _configuration["Jwt:Audience"] ?? "ChitStackApp",
            claims: claims,
            expires: DateTime.Now.AddDays(days),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
