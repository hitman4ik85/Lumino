using Lumino.Api.Application.DTOs;
using System.Collections.Generic;

namespace Lumino.Api.Application.Interfaces
{
    public interface IDemoLessonService
    {
        List<LessonResponse> GetDemoLessons(string? languageCode = null, string? level = null);

        DemoNextLessonResponse GetDemoNextLesson(int step, string? languageCode = null, string? level = null);

        DemoNextLessonPackResponse GetDemoNextLessonPack(int step, string? languageCode = null, string? level = null);

        LessonResponse GetDemoLessonById(int lessonId, string? languageCode = null, string? level = null);

        List<ExerciseResponse> GetDemoExercisesByLesson(int lessonId, string? languageCode = null, string? level = null);

        SubmitLessonResponse SubmitDemoLesson(SubmitLessonRequest request, string? languageCode = null, string? level = null);
    }
}
