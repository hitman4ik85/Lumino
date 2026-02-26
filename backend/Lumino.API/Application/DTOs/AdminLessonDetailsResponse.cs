namespace Lumino.Api.Application.DTOs
{
    public class AdminLessonDetailsResponse : AdminLessonResponse
    {
        public int ExercisesCount { get; set; }

        public List<AdminExerciseResponse> Exercises { get; set; } = new();

        public List<AdminVocabularyItemResponse> Vocabulary { get; set; } = new();
    }
}
