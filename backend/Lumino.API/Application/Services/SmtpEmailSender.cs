using Lumino.Api.Application.Interfaces;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace Lumino.Api.Application.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly EmailSettings _settings;

        public SmtpEmailSender(IOptions<EmailSettings> settings)
        {
            _settings = settings.Value;
        }

        public void Send(string toEmail, string subject, string htmlBody)
        {
            if (string.IsNullOrWhiteSpace(_settings.Host) || string.IsNullOrWhiteSpace(_settings.FromEmail))
            {
                return;
            }

            using var message = new MailMessage();
            message.From = new MailAddress(_settings.FromEmail!, string.IsNullOrWhiteSpace(_settings.FromName) ? null : _settings.FromName);
            message.To.Add(new MailAddress(toEmail));
            message.Subject = subject;
            message.Body = htmlBody;
            message.IsBodyHtml = true;

            using var client = new SmtpClient(_settings.Host!, _settings.Port);
            client.EnableSsl = _settings.EnableSsl;

            if (!string.IsNullOrWhiteSpace(_settings.Username))
            {
                client.Credentials = new NetworkCredential(_settings.Username, _settings.Password);
            }

            client.Send(message);
        }
    }
}
