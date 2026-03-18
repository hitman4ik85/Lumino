namespace Lumino.Api.Application.DTOs
{
    public class UpdateAchievementRequest
    {
        public string Title { get; set; } = null!;

        public string? Description { get; set; }

        public string? ImageUrl { get; set; }
    }
}
