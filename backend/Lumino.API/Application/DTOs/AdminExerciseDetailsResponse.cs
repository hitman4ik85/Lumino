namespace Lumino.Api.Application.DTOs
{
    public class AdminExerciseDetailsResponse : AdminExerciseResponse
    {
        public List<string> CorrectAnswers { get; set; } = new();

        public AdminExercisePreviewResponse Preview { get; set; } = new();
    }
}
