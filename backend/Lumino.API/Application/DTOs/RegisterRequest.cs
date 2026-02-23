namespace Lumino.Api.Application.DTOs
{
    public class RegisterRequest
    {
        public string Email { get; set; } = null!;

        public string Password { get; set; } = null!;

        public string? NativeLanguageCode { get; set; }

        public string? TargetLanguageCode { get; set; }
    }
}
