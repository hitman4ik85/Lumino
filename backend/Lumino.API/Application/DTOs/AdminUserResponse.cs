namespace Lumino.Api.Application.DTOs
{
    public class AdminUserResponse : UserProfileResponse
    {
        public int Points { get; set; }

        public List<int> CourseIds { get; set; } = new();

        public int? ActiveCourseId { get; set; }

        public DateTime? BlockedUntilUtc { get; set; }

        public bool IsBlocked { get; set; }

        public bool IsPrimaryAdmin { get; set; }
    }
}
