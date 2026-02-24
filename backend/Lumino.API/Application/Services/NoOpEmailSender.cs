using Lumino.Api.Application.Interfaces;

namespace Lumino.Api.Application.Services
{
    public class NoOpEmailSender : IEmailSender
    {
        public void Send(string toEmail, string subject, string htmlBody)
        {
            // Intentionally no-op (used in Testing or when Email is not configured).
        }
    }
}
