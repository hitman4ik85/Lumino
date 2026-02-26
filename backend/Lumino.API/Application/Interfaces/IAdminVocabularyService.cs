using Lumino.Api.Application.DTOs;

namespace Lumino.Api.Application.Interfaces
{
    public interface IAdminVocabularyService
    {
        List<AdminVocabularyItemResponse> GetAll();

        AdminVocabularyItemResponse GetById(int id);

        AdminVocabularyItemResponse Create(CreateVocabularyItemRequest request);

        void Update(int id, UpdateVocabularyItemRequest request);

        void Delete(int id);

        void LinkToLesson(int lessonId, int vocabularyItemId);

        void UnlinkFromLesson(int lessonId, int vocabularyItemId);

        List<AdminVocabularyItemResponse> GetByLesson(int lessonId);
    }
}
