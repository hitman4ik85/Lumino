namespace Lumino.Api.Application.DTOs
{
    public class AdminTopicDetailsResponse : AdminTopicResponse
    {
        public int LessonsCount { get; set; }

        public int ExercisesCount { get; set; }

        public List<AdminLessonResponse> Lessons { get; set; } = new();
    }
}
