namespace Lumino.Api.Application.DTOs
{
    public class LanguageAvailabilityResponse
    {
        public string LanguageCode { get; set; } = null!;

        public bool HasPublishedCourses { get; set; }
    }
}
