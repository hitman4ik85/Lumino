namespace Lumino.Api.Utils
{
    public class EmailNotVerifiedException : Exception
    {
        public EmailNotVerifiedException(string message) : base(message)
        {
        }
    }
}
