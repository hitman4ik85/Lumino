namespace Lumino.Api.Application.DTOs
{
    public class ImportExercisesRequest
    {
        public bool ReplaceExisting { get; set; }

        public List<ExportExerciseJson> Exercises { get; set; } = new();
    }
}
