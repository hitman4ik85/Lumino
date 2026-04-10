namespace Lumino.Api.Application.DTOs
{
    public class AdminUserUpsertRequest
    {
        public string? Username { get; set; }

        public string Email { get; set; } = null!;

        public string? Password { get; set; }

        public string? AvatarUrl { get; set; }

        public string? NativeLanguageCode { get; set; }

        public string? TargetLanguageCode { get; set; }

        public string Role { get; set; } = "User";

        public bool IsEmailVerified { get; set; } = true;

        public int Hearts { get; set; } = 5;

        public int Crystals { get; set; }

        public int Points { get; set; }

        public DateTime? BlockedUntilUtc { get; set; }

        public string Theme { get; set; } = "light";

        public List<int> CourseIds { get; set; } = new();

        public int? ActiveCourseId { get; set; }
    }
}
