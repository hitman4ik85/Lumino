namespace Lumino.Api.Application.DTOs
{
    public class AdminCourseDetailsResponse : AdminCourseResponse
    {
        public int TopicsCount { get; set; }

        public int LessonsCount { get; set; }

        public int ExercisesCount { get; set; }

        public int ScenesCount { get; set; }

        public List<AdminTopicResponse> Topics { get; set; } = new();

        public List<AdminSceneResponse> ScenesPreview { get; set; } = new();
    }
}
