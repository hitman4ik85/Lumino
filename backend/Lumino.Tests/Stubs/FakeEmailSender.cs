using Lumino.Api.Application.Interfaces;

namespace Lumino.Tests.Stubs
{
    public class FakeEmailSender : IEmailSender
    {
        public int SendCallsCount { get; private set; }
        public string? LastToEmail { get; private set; }
        public string? LastSubject { get; private set; }
        public string? LastHtmlBody { get; private set; }

        public void Send(string toEmail, string subject, string htmlBody)
        {
            SendCallsCount++;
            LastToEmail = toEmail;
            LastSubject = subject;
            LastHtmlBody = htmlBody;
        }
    }
}
