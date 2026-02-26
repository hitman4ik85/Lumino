using Lumino.Api.Application.DTOs;
using System.Collections.Generic;

namespace Lumino.Api.Application.Interfaces
{
    public interface IAdminLessonService
    {
        List<AdminLessonResponse> GetByTopic(int topicId);

        AdminLessonDetailsResponse GetById(int id);

        AdminLessonDetailsResponse Copy(int id, CopyItemRequest? request);

        List<ExportExerciseJson> ExportExercises(int lessonId);

        AdminLessonDetailsResponse ImportExercises(int lessonId, ImportExercisesRequest request);

        AdminLessonResponse Create(CreateLessonRequest request);

        void Update(int id, UpdateLessonRequest request);

        void Delete(int id);
    }
}
