namespace Lumino.Api.Application.DTOs
{
    public class UpdateUserLanguagesRequest
    {
        public string NativeLanguageCode { get; set; } = null!;

        public string TargetLanguageCode { get; set; } = null!;
    }
}
