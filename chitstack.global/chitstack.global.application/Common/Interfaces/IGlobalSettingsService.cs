namespace ChitStack.Application.Common.Interfaces;

public record GlobalSettingDto(
    string Group,
    string Key,
    string? Value,
    string? Description,
    bool IsSecret);

public interface IGlobalSettingsService
{
    /// <summary>Returns the raw setting value, or null if not found.</summary>
    Task<string?> GetAsync(string group, string key, CancellationToken ct = default);

    /// <summary>Returns all settings, with secret values replaced by null.</summary>
    Task<IReadOnlyList<GlobalSettingDto>> GetAllAsync(CancellationToken ct = default);

    /// <summary>Persists a single setting and invalidates the cache.</summary>
    Task UpsertAsync(string group, string key, string? value, string modifiedBy, CancellationToken ct = default);
}

/// <summary>Well-known setting groups and keys — prevents magic strings across the codebase.</summary>
public static class SettingKeys
{
    public static class DemoStamp
    {
        public const string Group = "DemoStamp";
        public const string ConnectionString = "ConnectionString";
        public const string TrialDays = "TrialDays";
        public const string DemoTenantId = "DemoTenantId";
        public const string DemoBranchId = "DemoBranchId";
        public const string DemoPortalUrl = "DemoPortalUrl";
    }

    public static class Platform
    {
        public const string Group = "Platform";
        public const string AMCPercentage = "AMCPercentage";
        public const string AdminEmail = "AdminEmail";
        public const string PaymentUpiId = "PaymentUpiId";
        public const string PaymentBankName = "PaymentBankName";
        public const string PaymentAccountNumber = "PaymentAccountNumber";
        public const string PaymentIfsc = "PaymentIfsc";
        public const string GlobalPortalBaseUrl = "GlobalPortalBaseUrl";
    }

    public static class Email
    {
        public const string Group = "Email";
        public const string SmtpHost = "SmtpHost";
        public const string SmtpPort = "SmtpPort";
        public const string SmtpUseSsl = "SmtpUseSsl";
        public const string FromAddress = "FromAddress";
        public const string FromName = "FromName";
        public const string Username = "Username";
        public const string Password = "Password";
    }
}
