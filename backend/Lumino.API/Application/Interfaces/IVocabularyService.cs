using Lumino.Api.Application.DTOs;
using System.Collections.Generic;

namespace Lumino.Api.Application.Interfaces
{
    public interface IVocabularyService
    {
        List<VocabularyResponse> GetMyVocabulary(int userId);

        List<VocabularyResponse> GetDueVocabulary(int userId);

        VocabularyResponse? GetNextReview(int userId);

        VocabularyItemDetailsResponse GetItemDetails(int userId, int vocabularyItemId);

        VocabularyItemDetailsResponse? LookupWord(int userId, string word);

        void AddWord(int userId, AddVocabularyRequest request);

        void UpdateWord(int userId, int userVocabularyId, UpdateUserVocabularyRequest request);

        VocabularyResponse ReviewWord(int userId, int userVocabularyId, ReviewVocabularyRequest request);

        void ScheduleReview(int userId, int userVocabularyId, ScheduleVocabularyReviewRequest request);

        void DeleteWord(int userId, int userVocabularyId);
    }
}
