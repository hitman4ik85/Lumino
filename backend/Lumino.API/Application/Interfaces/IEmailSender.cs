namespace Lumino.Api.Application.Interfaces
{
    public interface IEmailSender
    {
        void Send(string toEmail, string subject, string htmlBody);
    }
}
