namespace Lumino.Api.Application.DTOs
{
    public class CopyItemRequest
    {
        public string? TitleSuffix { get; set; }

        public int? TargetLessonId { get; set; }

        public int? TargetTopicId { get; set; }

        public int? TargetCourseId { get; set; }
    }
}
