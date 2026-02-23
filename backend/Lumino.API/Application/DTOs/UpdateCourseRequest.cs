namespace Lumino.Api.Application.DTOs
{
    public class UpdateCourseRequest
    {
        public string Title { get; set; } = null!;

        public string Description { get; set; } = null!;

        public string? LanguageCode { get; set; }

        public bool IsPublished { get; set; }
    }
}
