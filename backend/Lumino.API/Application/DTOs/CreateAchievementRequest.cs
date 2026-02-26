namespace Lumino.Api.Application.DTOs
{
    public class CreateAchievementRequest
    {
        public string? Code { get; set; }

        public string Title { get; set; } = null!;

        public string Description { get; set; } = null!;
    }
}
