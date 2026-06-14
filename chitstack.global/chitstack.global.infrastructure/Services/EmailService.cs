using System.Net;
using System.Net.Mail;
using ChitStack.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ChitStack.Infrastructure.Global.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var host = _configuration["Email:SmtpHost"];
        var port = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
        var useSsl = bool.Parse(_configuration["Email:SmtpUseSsl"] ?? "true");
        var from = _configuration["Email:FromAddress"] ?? "noreply@chitstack.com";
        var fromName = _configuration["Email:FromName"] ?? "ChitStack";
        var username = _configuration["Email:Username"];
        var password = _configuration["Email:Password"];

        if (string.IsNullOrWhiteSpace(host))
        {
            _logger.LogWarning("Email SMTP host not configured. Skipping send to {To} — Subject: {Subject}", to, subject);
            _logger.LogInformation("Email body:\n{Body}", htmlBody);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(from, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        message.To.Add(to);

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = useSsl,
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
