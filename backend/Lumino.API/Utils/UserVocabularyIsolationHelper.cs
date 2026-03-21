using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;

namespace Lumino.Api.Utils
{
    public static class UserVocabularyIsolationHelper
    {
        public static void EnsureUserWord(
            LuminoDbContext dbContext,
            int userId,
            string word,
            string translation,
            VocabularyItem? templateItem,
            DateTime now,
            bool isMistake,
            DateTime defaultNextReviewAt)
        {
            var normalizedWord = Normalize(word);
            var normalizedTranslation = Normalize(translation);

            if (string.IsNullOrWhiteSpace(normalizedWord) || string.IsNullOrWhiteSpace(normalizedTranslation))
            {
                return;
            }

            var userWord = (
                from uv in dbContext.UserVocabularies
                join vi in dbContext.VocabularyItems on uv.VocabularyItemId equals vi.Id
                where uv.UserId == userId
                    && vi.Word.ToLower() == normalizedWord.ToLower()
                    && vi.Translation.ToLower() == normalizedTranslation.ToLower()
                orderby uv.Id
                select uv
            ).FirstOrDefault();

            VocabularyItem? item = null;

            if (userWord != null)
            {
                item = dbContext.VocabularyItems.FirstOrDefault(x => x.Id == userWord.VocabularyItemId);
            }

            if (userWord == null)
            {
                var privateItem = CreatePrivateCopy(dbContext, templateItem, normalizedWord, normalizedTranslation);

                dbContext.UserVocabularies.Add(new UserVocabulary
                {
                    UserId = userId,
                    VocabularyItemId = privateItem.Id,
                    AddedAt = now,
                    LastReviewedAt = null,
                    NextReviewAt = defaultNextReviewAt,
                    ReviewCount = 0
                });

                return;
            }

            if (item == null)
            {
                var privateItem = CreatePrivateCopy(dbContext, templateItem, normalizedWord, normalizedTranslation);
                userWord.VocabularyItemId = privateItem.Id;
            }
            else if (CanUseItemInPlace(dbContext, item.Id, userId) == false)
            {
                var privateItem = CreatePrivateCopy(dbContext, item, normalizedWord, normalizedTranslation);
                userWord.VocabularyItemId = privateItem.Id;
            }

            if (isMistake && userWord.NextReviewAt > now)
            {
                userWord.NextReviewAt = now;
            }
        }

        private static bool CanUseItemInPlace(LuminoDbContext dbContext, int vocabularyItemId, int userId)
        {
            var hasLessonLinks = dbContext.LessonVocabularies.Any(x => x.VocabularyItemId == vocabularyItemId);
            var hasExerciseLinks = dbContext.ExerciseVocabularies.Any(x => x.VocabularyItemId == vocabularyItemId);
            var hasOtherUsers = dbContext.UserVocabularies.Any(x => x.VocabularyItemId == vocabularyItemId && x.UserId != userId);

            return hasLessonLinks == false && hasExerciseLinks == false && hasOtherUsers == false;
        }

        private static VocabularyItem CreatePrivateCopy(LuminoDbContext dbContext, VocabularyItem? sourceItem, string word, string translation)
        {
            var item = new VocabularyItem
            {
                Word = word,
                Translation = translation,
                Example = sourceItem?.Example,
                PartOfSpeech = sourceItem?.PartOfSpeech,
                Definition = sourceItem?.Definition,
                Transcription = sourceItem?.Transcription,
                Gender = sourceItem?.Gender,
                ExamplesJson = sourceItem?.ExamplesJson,
                SynonymsJson = sourceItem?.SynonymsJson,
                IdiomsJson = sourceItem?.IdiomsJson
            };

            dbContext.VocabularyItems.Add(item);
            dbContext.SaveChanges();

            var sourceTranslations = sourceItem == null
                ? new List<string>()
                : dbContext.VocabularyItemTranslations
                    .Where(x => x.VocabularyItemId == sourceItem.Id)
                    .OrderBy(x => x.Order)
                    .Select(x => x.Translation)
                    .ToList();

            if (sourceTranslations.Count == 0)
            {
                sourceTranslations.Add(translation);
            }
            else
            {
                sourceTranslations[0] = translation;
            }

            for (var i = 0; i < sourceTranslations.Count; i++)
            {
                dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
                {
                    VocabularyItemId = item.Id,
                    Translation = sourceTranslations[i],
                    Order = i
                });
            }

            dbContext.SaveChanges();

            return item;
        }

        private static string Normalize(string value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? string.Empty
                : value.Trim();
        }
    }
}
