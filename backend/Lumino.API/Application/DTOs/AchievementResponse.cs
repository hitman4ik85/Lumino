namespace Lumino.Api.Application.DTOs
{
    public class AchievementResponse
    {
        public int Id { get; set; }

        public string Code { get; set; } = null!;

        public string Title { get; set; } = null!;

        public string Description { get; set; } = null!;

        public bool IsEarned { get; set; }

        public DateTime? EarnedAt { get; set; }

        public string? ImageUrl { get; set; }
    }
}
