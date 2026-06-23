using ChitStack.Application.Common.Interfaces;

namespace ChitStack.Infrastructure.Global.Services;

public class AffiliateCodeGenerator : IAffiliateCodeGenerator
{
    private static readonly Random _rng = new();

    public string Generate(string name)
    {
        var prefix = new string(
            name.Where(char.IsLetter).Take(3).Select(char.ToUpper).ToArray());
        if (prefix.Length < 2) prefix = "AFF";
        var suffix = _rng.Next(1000, 9999);
        return $"{prefix}-{suffix}";
    }
}
