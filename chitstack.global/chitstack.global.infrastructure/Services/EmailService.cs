using System.Net;
using System.Net.Mail;
using ChitStack.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace ChitStack.Infrastructure.Global.Services;

public class EmailService : IEmailService
{
    private readonly IGlobalSettingsService _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IGlobalSettingsService settings, ILogger<EmailService> logger)
    {
        _settings = settings;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var host = await _settings.GetAsync(SettingKeys.Email.Group, SettingKeys.Email.SmtpHost, cancellationToken);

        if (string.IsNullOrWhiteSpace(host))
        {
            _logger.LogWarning("SMTP host not configured — logging email instead of sending. To: {To} | Subject: {Subject}", to, subject);
            _logger.LogInformation("Email body:\n{Body}", htmlBody);
            return;
        }

        var port    = int.Parse(await _settings.GetAsync(SettingKeys.Email.Group, SettingKeys.Email.SmtpPort, cancellationToken) ?? "587");
        var useSsl  = bool.Parse(await _settings.GetAsync(SettingKeys.Email.Group, SettingKeys.Email.SmtpUseSsl, cancellationToken) ?? "true");
        var from    = await _settings.GetAsync(SettingKeys.Email.Group, SettingKeys.Email.FromAddress, cancellationToken) ?? "noreply@chitstack.com";
        var fromName= await _settings.GetAsync(SettingKeys.Email.Group, SettingKeys.Email.FromName, cancellationToken) ?? "ChitStack";
        var username= await _settings.GetAsync(SettingKeys.Email.Group, SettingKeys.Email.Username, cancellationToken);
        var password= await _settings.GetAsync(SettingKeys.Email.Group, SettingKeys.Email.Password, cancellationToken);

        using var message = new MailMessage
        {
            From      = new MailAddress(from, fromName),
            Subject   = subject,
            Body      = htmlBody,
            IsBodyHtml= true
        };
        message.To.Add(to);

        using var client = new SmtpClient(host, port)
        {
            EnableSsl   = useSsl,
            Credentials = string.IsNullOrWhiteSpace(username)
                ? null
                : new NetworkCredential(username, password)
        };

        try
        {
            await client.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("Email sent to {To} — Subject: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
        }
    }
}
