namespace Lumino.Api.Application.DTOs
{
    public class AdminAchievementResponse
    {
        public int Id { get; set; }

        public string Code { get; set; } = null!;

        public string Title { get; set; } = null!;

        public string Description { get; set; } = null!;

        public bool IsSystem { get; set; }

        public bool CanEditDescription { get; set; }

        public string? ImageUrl { get; set; }

        public string? ConditionType { get; set; }

        public int? ConditionThreshold { get; set; }
    }
}
