using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Lumino.Api.Application.Services
{
    public class VocabularyService : IVocabularyService
    {
        private readonly LuminoDbContext _dbContext;
        private readonly IDateTimeProvider _dateTimeProvider;
        private readonly LearningSettings _learningSettings;

        public VocabularyService(LuminoDbContext dbContext, IDateTimeProvider dateTimeProvider, IOptions<LearningSettings> learningSettings)
        {
            _dbContext = dbContext;
            _dateTimeProvider = dateTimeProvider;
            _learningSettings = learningSettings?.Value ?? new LearningSettings();
        }

        public List<VocabularyResponse> GetMyVocabulary(int userId)
        {
            var query =
                from uv in _dbContext.UserVocabularies.AsNoTracking()
                join vi in _dbContext.VocabularyItems.AsNoTracking() on uv.VocabularyItemId equals vi.Id
                where uv.UserId == userId
                orderby uv.AddedAt descending
                select new VocabularyResponse
                {
                    Id = uv.Id,
                    VocabularyItemId = vi.Id,
                    Word = vi.Word,
                    Translation = vi.Translation,
                    Example = vi.Example,
                    AddedAt = uv.AddedAt,
                    LastReviewedAt = uv.LastReviewedAt,
                    NextReviewAt = uv.NextReviewAt,
                    ReviewCount = uv.ReviewCount
                };

            var list = query.ToList();

            ApplyTranslations(list);

            return list;
        }

        public List<VocabularyResponse> GetDueVocabulary(int userId)
        {
            var now = _dateTimeProvider.UtcNow;

            var query =
                from uv in _dbContext.UserVocabularies.AsNoTracking()
                join vi in _dbContext.VocabularyItems.AsNoTracking() on uv.VocabularyItemId equals vi.Id
                where uv.UserId == userId && uv.NextReviewAt <= now
                orderby uv.NextReviewAt, uv.AddedAt
                select new VocabularyResponse
                {
                    Id = uv.Id,
                    VocabularyItemId = vi.Id,
                    Word = vi.Word,
                    Translation = vi.Translation,
                    Example = vi.Example,
                    AddedAt = uv.AddedAt,
                    LastReviewedAt = uv.LastReviewedAt,
                    NextReviewAt = uv.NextReviewAt,
                    ReviewCount = uv.ReviewCount
                };

            var list = query.ToList();

            ApplyTranslations(list);

            return list;
        }

        public VocabularyResponse? GetNextReview(int userId)
        {
            var now = _dateTimeProvider.UtcNow;

            var entity =
                _dbContext.UserVocabularies
                    .AsNoTracking()
                    .Where(x => x.UserId == userId && x.NextReviewAt <= now)
                    .OrderBy(x => x.NextReviewAt)
                    .ThenBy(x => x.AddedAt)
                    .FirstOrDefault();

            if (entity == null)
            {
                return null;
            }

            var item = _dbContext.VocabularyItems.AsNoTracking().First(x => x.Id == entity.VocabularyItemId);

            var response = new VocabularyResponse
            {
                Id = entity.Id,
                VocabularyItemId = item.Id,
                Word = item.Word,
                Translation = item.Translation,
                Example = item.Example,
                AddedAt = entity.AddedAt,
                LastReviewedAt = entity.LastReviewedAt,
                NextReviewAt = entity.NextReviewAt,
                ReviewCount = entity.ReviewCount
            };

            ApplyTranslations(response);

            return response;
        }

        public void AddWord(int userId, AddVocabularyRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            if (string.IsNullOrWhiteSpace(request.Word))
            {
                throw new ArgumentException("Word is required");
            }

            var word = request.Word.Trim();
            var normalizedWord = word.ToLower();
            var hasProvidedTranslation = string.IsNullOrWhiteSpace(request.Translation) == false;

            var templateCandidates = GetTemplateCandidates(word);
            var templateItem = SelectCandidate(templateCandidates, hasProvidedTranslation ? request.Translation!.Trim() : string.Empty);

            if (templateItem == null && hasProvidedTranslation == false)
            {
                throw new ArgumentException("Translation is required");
            }

            var translations = hasProvidedTranslation
                ? NormalizeTranslations(request.Translation!, request.Translations)
                : GetTranslationsForItem(templateItem!);

            if (translations.Count == 0)
            {
                throw new ArgumentException("Translation is required");
            }

            var primaryTranslation = translations[0];

            var existingUserItem = (
                from uv in _dbContext.UserVocabularies
                join vi in _dbContext.VocabularyItems on uv.VocabularyItemId equals vi.Id
                where uv.UserId == userId && vi.Word.ToLower() == normalizedWord
                orderby uv.Id
                select vi
            ).ToList();

            var alreadyAddedItem = SelectCandidate(existingUserItem, primaryTranslation);

            if (alreadyAddedItem != null)
            {
                return;
            }

            var normalizedExamples = NormalizeStringList(request.Examples);
            var created = new VocabularyItem
            {
                Word = word,
                Translation = primaryTranslation,
                Example = FirstNotEmpty(request.Example, normalizedExamples.FirstOrDefault(), templateItem?.Example),
                PartOfSpeech = FirstNotEmpty(request.PartOfSpeech, templateItem?.PartOfSpeech),
                Definition = FirstNotEmpty(request.Definition, templateItem?.Definition),
                Transcription = FirstNotEmpty(request.Transcription, templateItem?.Transcription),
                Gender = FirstNotEmpty(request.Gender, templateItem?.Gender),
                ExamplesJson = SerializeStringList(normalizedExamples.Count > 0 ? normalizedExamples : DeserializeOrEmpty<List<string>>(templateItem?.ExamplesJson)),
                SynonymsJson = SerializeRelationList(NormalizeRelationWords(request.Synonyms, DeserializeOrEmpty<List<VocabularyRelationDto>>(templateItem?.SynonymsJson))),
                IdiomsJson = SerializeRelationList(NormalizeRelationWords(request.Idioms, DeserializeOrEmpty<List<VocabularyRelationDto>>(templateItem?.IdiomsJson)))
            };

            _dbContext.VocabularyItems.Add(created);
            _dbContext.SaveChanges();

            EnsureTranslations(created.Id, primaryTranslation, translations);

            var now = _dateTimeProvider.UtcNow;

            var userWord = new UserVocabulary
            {
                UserId = userId,
                VocabularyItemId = created.Id,
                AddedAt = now,
                LastReviewedAt = null,
                NextReviewAt = now,
                ReviewCount = 0
            };

            _dbContext.UserVocabularies.Add(userWord);
            _dbContext.SaveChanges();
        }

        private static VocabularyItem? SelectCandidate(List<VocabularyItem> candidates, string primaryTranslation)
        {
            if (candidates.Count == 0)
            {
                return null;
            }

            if (candidates.Count == 1)
            {
                return candidates[0];
            }

            if (string.IsNullOrWhiteSpace(primaryTranslation))
            {
                return candidates[0];
            }

            var normalizedPrimary = primaryTranslation.ToLower();
            var exact = candidates.FirstOrDefault(x => x.Translation.ToLower() == normalizedPrimary);
            return exact ?? candidates[0];
        }

        private List<VocabularyItem> GetTemplateCandidates(string word)
        {
            var normalizedWord = word.Trim().ToLower();

            var linkedIds = _dbContext.LessonVocabularies
                .Select(x => x.VocabularyItemId)
                .Union(_dbContext.ExerciseVocabularies.Select(x => x.VocabularyItemId))
                .Distinct()
                .ToList();

            return _dbContext.VocabularyItems
                .Where(x => x.Word.ToLower() == normalizedWord)
                .OrderByDescending(x => linkedIds.Contains(x.Id))
                .ThenBy(x => x.Id)
                .ToList();
        }

        private List<string> GetTranslationsForItem(VocabularyItem item)
        {
            var translations = _dbContext.VocabularyItemTranslations
                .Where(x => x.VocabularyItemId == item.Id)
                .OrderBy(x => x.Order)
                .Select(x => x.Translation)
                .ToList();

            if (translations.Count == 0 && string.IsNullOrWhiteSpace(item.Translation) == false)
            {
                translations.Add(item.Translation);
            }

            return translations;
        }

        private bool CanUpdateVocabularyItemInPlace(int vocabularyItemId, int userId)
        {
            var hasLessonLinks = _dbContext.LessonVocabularies.Any(x => x.VocabularyItemId == vocabularyItemId);
            var hasExerciseLinks = _dbContext.ExerciseVocabularies.Any(x => x.VocabularyItemId == vocabularyItemId);
            var hasOtherUsers = _dbContext.UserVocabularies.Any(x => x.VocabularyItemId == vocabularyItemId && x.UserId != userId);

            return hasLessonLinks == false && hasExerciseLinks == false && hasOtherUsers == false;
        }

        private void CleanupVocabularyItemIfUnused(int vocabularyItemId)
        {
            var hasUserLinks = _dbContext.UserVocabularies.Any(x => x.VocabularyItemId == vocabularyItemId);
            var hasLessonLinks = _dbContext.LessonVocabularies.Any(x => x.VocabularyItemId == vocabularyItemId);
            var hasExerciseLinks = _dbContext.ExerciseVocabularies.Any(x => x.VocabularyItemId == vocabularyItemId);

            if (hasUserLinks || hasLessonLinks || hasExerciseLinks)
            {
                return;
            }

            var item = _dbContext.VocabularyItems.FirstOrDefault(x => x.Id == vocabularyItemId);

            if (item == null)
            {
                return;
            }

            _dbContext.VocabularyItems.Remove(item);
            _dbContext.SaveChanges();
        }

        private static List<string> NormalizeStringList(List<string>? values)
        {
            return values
                ?.Where(x => string.IsNullOrWhiteSpace(x) == false)
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList()
                ?? new List<string>();
        }

        private static List<string> NormalizeRelationWords(List<string>? values, List<VocabularyRelationDto>? fallback)
        {
            var list = values
                ?.Where(x => string.IsNullOrWhiteSpace(x) == false)
                .Select(x => x.Trim())
                .ToList();

            if (list == null || list.Count == 0)
            {
                list = fallback
                    ?.Where(x => string.IsNullOrWhiteSpace(x.Word) == false)
                    .Select(x => x.Word.Trim())
                    .ToList()
                    ?? new List<string>();
            }

            return list
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static string? FirstNotEmpty(params string?[] values)
        {
            foreach (var value in values)
            {
                if (string.IsNullOrWhiteSpace(value) == false)
                {
                    return value.Trim();
                }
            }

            return null;
        }



        public VocabularyItemDetailsResponse? LookupWord(int userId, string word)
        {
            if (string.IsNullOrWhiteSpace(word))
            {
                return null;
            }

            var normalizedWord = word.Trim().ToLower();

            var item = GetTemplateCandidates(normalizedWord)
                .FirstOrDefault();

            if (item == null)
            {
                return null;
            }

            return GetItemDetails(userId, item.Id);
        }

        public void UpdateWord(int userId, int userVocabularyId, UpdateUserVocabularyRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            if (string.IsNullOrWhiteSpace(request.Word))
            {
                throw new ArgumentException("Word is required");
            }

            var userVocabulary = _dbContext.UserVocabularies
                .FirstOrDefault(x => x.Id == userVocabularyId && x.UserId == userId);

            if (userVocabulary == null)
            {
                throw new KeyNotFoundException("Vocabulary word not found");
            }

            var item = _dbContext.VocabularyItems
                .FirstOrDefault(x => x.Id == userVocabulary.VocabularyItemId);

            if (item == null)
            {
                throw new KeyNotFoundException("Vocabulary item not found");
            }

            var translations = NormalizeTranslations(request.Translation ?? string.Empty, request.Translations);
            var primaryTranslation = translations[0];
            var examples = NormalizeStringList(request.Examples);
            var synonyms = NormalizeRelationWords(request.Synonyms, null);
            var idioms = NormalizeRelationWords(request.Idioms, null);

            if (CanUpdateVocabularyItemInPlace(item.Id, userId) == false)
            {
                var clonedItem = new VocabularyItem
                {
                    Word = request.Word.Trim(),
                    Translation = primaryTranslation,
                    Example = FirstNotEmpty(request.Example, examples.FirstOrDefault()),
                    PartOfSpeech = FirstNotEmpty(request.PartOfSpeech),
                    Definition = FirstNotEmpty(request.Definition),
                    Transcription = FirstNotEmpty(request.Transcription),
                    Gender = FirstNotEmpty(request.Gender),
                    ExamplesJson = SerializeStringList(examples),
                    SynonymsJson = SerializeRelationList(synonyms),
                    IdiomsJson = SerializeRelationList(idioms)
                };

                _dbContext.VocabularyItems.Add(clonedItem);
                _dbContext.SaveChanges();

                EnsureTranslations(clonedItem.Id, primaryTranslation, translations);

                userVocabulary.VocabularyItemId = clonedItem.Id;
                _dbContext.SaveChanges();

                CleanupVocabularyItemIfUnused(item.Id);
                return;
            }

            item.Word = request.Word.Trim();
            item.Translation = primaryTranslation;
            item.Example = FirstNotEmpty(request.Example, examples.FirstOrDefault());
            item.PartOfSpeech = FirstNotEmpty(request.PartOfSpeech);
            item.Definition = FirstNotEmpty(request.Definition);
            item.Transcription = FirstNotEmpty(request.Transcription);
            item.Gender = FirstNotEmpty(request.Gender);
            item.ExamplesJson = SerializeStringList(examples);
            item.SynonymsJson = SerializeRelationList(synonyms);
            item.IdiomsJson = SerializeRelationList(idioms);

            var existingTranslations = _dbContext.VocabularyItemTranslations
                .Where(x => x.VocabularyItemId == item.Id)
                .ToList();

            if (existingTranslations.Count > 0)
            {
                _dbContext.VocabularyItemTranslations.RemoveRange(existingTranslations);
                _dbContext.SaveChanges();
            }

            for (var i = 0; i < translations.Count; i++)
            {
                _dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
                {
                    VocabularyItemId = item.Id,
                    Translation = translations[i],
                    Order = i
                });
            }

            _dbContext.SaveChanges();
            EnsurePrimaryTranslation(item.Id, primaryTranslation);
        }

        public VocabularyResponse ReviewWord(int userId, int userVocabularyId, ReviewVocabularyRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var entity = _dbContext.UserVocabularies
                .FirstOrDefault(x => x.Id == userVocabularyId && x.UserId == userId);

            if (entity == null)
            {
                throw new KeyNotFoundException("Vocabulary word not found");
            }


            var idempotencyKey = request.IdempotencyKey;

            if (string.IsNullOrWhiteSpace(idempotencyKey) == false)
            {
                if (entity.ReviewIdempotencyKey == idempotencyKey)
                {
                    var existingItem = _dbContext.VocabularyItems.AsNoTracking().First(x => x.Id == entity.VocabularyItemId);

                    var existingResponse = new VocabularyResponse
                    {
                        Id = entity.Id,
                        VocabularyItemId = existingItem.Id,
                        Word = existingItem.Word,
                        Translation = existingItem.Translation,
                        Example = existingItem.Example,
                        AddedAt = entity.AddedAt,
                        LastReviewedAt = entity.LastReviewedAt,
                        NextReviewAt = entity.NextReviewAt,
                        ReviewCount = entity.ReviewCount
                    };

                    ApplyTranslations(existingResponse);

                    return existingResponse;
                }
            }
            var now = _dateTimeProvider.UtcNow;

            entity.LastReviewedAt = now;

            var action = request.Action;

            if (string.IsNullOrWhiteSpace(action) == false)
            {
                action = action.Trim().ToLowerInvariant();
            }

            bool isSkip = action == "skip" || action == "not_sure" || action == "unsure";
            bool isCorrect = action == "correct" ? true : (action == "wrong" || action == "incorrect" ? false : request.IsCorrect);

            if (isSkip)
            {
                entity.NextReviewAt = now.AddMinutes(_learningSettings.VocabularySkipDelayMinutes);
            }
            else if (isCorrect)
            {
                entity.ReviewCount = entity.ReviewCount + 1;
                entity.NextReviewAt = CalculateNextReviewAt(now, entity.ReviewCount);
            }
            else
            {
                entity.ReviewCount = 0;
                entity.NextReviewAt = now.AddHours(_learningSettings.VocabularyWrongDelayHours);
            }


            if (string.IsNullOrWhiteSpace(idempotencyKey) == false)
            {
                entity.ReviewIdempotencyKey = idempotencyKey;
            }

            _dbContext.SaveChanges();

            var item = _dbContext.VocabularyItems.AsNoTracking().First(x => x.Id == entity.VocabularyItemId);

            var response = new VocabularyResponse
            {
                Id = entity.Id,
                VocabularyItemId = item.Id,
                Word = item.Word,
                Translation = item.Translation,
                Example = item.Example,
                AddedAt = entity.AddedAt,
                LastReviewedAt = entity.LastReviewedAt,
                NextReviewAt = entity.NextReviewAt,
                ReviewCount = entity.ReviewCount
            };

            ApplyTranslations(response);

            return response;
        }

        public void ScheduleReview(int userId, int userVocabularyId, ScheduleVocabularyReviewRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var entity = _dbContext.UserVocabularies
                .FirstOrDefault(x => x.Id == userVocabularyId && x.UserId == userId);

            if (entity == null)
            {
                throw new KeyNotFoundException("Vocabulary word not found");
            }

            var period = string.IsNullOrWhiteSpace(request.Period)
                ? string.Empty
                : request.Period.Trim().ToLowerInvariant();

            var now = _dateTimeProvider.UtcNow;

            if (period == "today")
            {
                entity.NextReviewAt = now;
            }
            else if (period == "tomorrow")
            {
                entity.NextReviewAt = now.AddDays(1);
            }
            else if (period == "days")
            {
                if (request.Days == null || request.Days.Value < 2)
                {
                    throw new ArgumentException("Days must be greater than or equal to 2");
                }

                entity.NextReviewAt = now.AddDays(request.Days.Value);
            }
            else
            {
                throw new ArgumentException("Unknown review period");
            }

            _dbContext.SaveChanges();
        }

        public void DeleteWord(int userId, int userVocabularyId)
        {
            var entity = _dbContext.UserVocabularies
                .FirstOrDefault(x => x.Id == userVocabularyId && x.UserId == userId);

            if (entity == null)
            {
                throw new KeyNotFoundException("Vocabulary word not found");
            }

            var vocabularyItemId = entity.VocabularyItemId;

            _dbContext.UserVocabularies.Remove(entity);
            _dbContext.SaveChanges();

            CleanupVocabularyItemIfUnused(vocabularyItemId);
        }


        private void ApplyTranslations(List<VocabularyResponse> list)
        {
            if (list == null || list.Count == 0)
            {
                return;
            }

            var ids = list.Select(x => x.VocabularyItemId).Distinct().ToList();

            var translations = _dbContext.VocabularyItemTranslations
                .AsNoTracking()
                .Where(x => ids.Contains(x.VocabularyItemId))
                .OrderBy(x => x.VocabularyItemId)
                .ThenBy(x => x.Order)
                .ToList();

            var map = translations
                .GroupBy(x => x.VocabularyItemId)
                .ToDictionary(x => x.Key, x => x.Select(t => t.Translation).ToList());

            foreach (var item in list)
            {
                if (map.TryGetValue(item.VocabularyItemId, out var listTranslations) && listTranslations.Count > 0)
                {
                    item.Translations = listTranslations;
                    item.Translation = listTranslations[0];
                }
                else
                {
                    item.Translations = new List<string> { item.Translation };
                }
            }
        }

        private void ApplyTranslations(VocabularyResponse item)
        {
            if (item == null)
            {
                return;
            }

            var list = _dbContext.VocabularyItemTranslations
                .AsNoTracking()
                .Where(x => x.VocabularyItemId == item.VocabularyItemId)
                .OrderBy(x => x.Order)
                .Select(x => x.Translation)
                .ToList();

            if (list.Count > 0)
            {
                item.Translations = list;
                item.Translation = list[0];
            }
            else
            {
                item.Translations = new List<string> { item.Translation };
            }
        }

        private List<string> NormalizeTranslations(string translation, List<string>? translations)
        {
            var list = new List<string>();

            if (!string.IsNullOrWhiteSpace(translation))
            {
                list.Add(translation.Trim());
            }

            if (translations != null && translations.Count > 0)
            {
                foreach (var t in translations)
                {
                    if (string.IsNullOrWhiteSpace(t))
                    {
                        continue;
                    }

                    list.Add(t.Trim());
                }
            }

            list = list
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (list.Count == 0)
            {
                throw new ArgumentException("Translation is required");
            }

            return list;
        }

        private void EnsureTranslations(int vocabularyItemId, string primaryTranslation, List<string> translations)
        {
            if (translations == null || translations.Count == 0)
            {
                return;
            }

            var existing = _dbContext.VocabularyItemTranslations
                .AsNoTracking()
                .Where(x => x.VocabularyItemId == vocabularyItemId)
                .OrderBy(x => x.Order)
                .ToList();

            if (existing.Count == 0)
            {
                for (var i = 0; i < translations.Count; i++)
                {
                    _dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
                    {
                        VocabularyItemId = vocabularyItemId,
                        Translation = translations[i],
                        Order = i
                    });
                }

                _dbContext.SaveChanges();
                EnsurePrimaryTranslation(vocabularyItemId, primaryTranslation);
                return;
            }

            var existingValues = existing
                .Select(x => x.Translation)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var nextOrder = existing.Max(x => x.Order) + 1;

            foreach (var t in translations)
            {
                if (existingValues.Contains(t))
                {
                    continue;
                }

                _dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
                {
                    VocabularyItemId = vocabularyItemId,
                    Translation = t,
                    Order = nextOrder
                });

                nextOrder++;
            }

            _dbContext.SaveChanges();
            EnsurePrimaryTranslation(vocabularyItemId, primaryTranslation);
        }

        private VocabularyItem FindOrCreateVocabularyItem(string word, string primaryTranslation, string? example, string? partOfSpeech, string? definition, string? transcription, string? gender, List<string>? examples, List<string>? synonyms, List<string>? idioms)
        {
            // We identify a vocabulary item by Word.
            // If the same word is added later with another primary translation,
            // it must extend the existing translations list.
            var normalizedWord = word.ToLower();

            var candidates = _dbContext.VocabularyItems
                .AsNoTracking()
                .Where(x => x.Word.ToLower() == normalizedWord)
                .OrderBy(x => x.Id)
                .ToList();

            if (candidates.Count == 0)
            {
                var normalizedExamples = examples
                    ?.Where(x => string.IsNullOrWhiteSpace(x) == false)
                    .Select(x => x.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList()
                    ?? new List<string>();

                var created = new VocabularyItem
                {
                    Word = word,
                    Translation = primaryTranslation,
                    Example = string.IsNullOrWhiteSpace(example) ? normalizedExamples.FirstOrDefault() : example,
                    PartOfSpeech = string.IsNullOrWhiteSpace(partOfSpeech) ? null : partOfSpeech.Trim(),
                    Definition = string.IsNullOrWhiteSpace(definition) ? null : definition.Trim(),
                    Transcription = string.IsNullOrWhiteSpace(transcription) ? null : transcription.Trim(),
                    Gender = string.IsNullOrWhiteSpace(gender) ? null : gender.Trim(),
                    ExamplesJson = SerializeStringList(normalizedExamples),
                    SynonymsJson = SerializeRelationList(synonyms),
                    IdiomsJson = SerializeRelationList(idioms)
                };

                _dbContext.VocabularyItems.Add(created);
                _dbContext.SaveChanges();

                return created;
            }

            if (candidates.Count == 1)
            {
                return candidates[0];
            }

            // If duplicates exist in DB, prefer an item whose Translation matches the primary.
            var normalizedPrimary = primaryTranslation.ToLower();
            var exact = candidates.FirstOrDefault(x => x.Translation.ToLower() == normalizedPrimary);
            return exact ?? candidates[0];
        }

        private void EnsurePrimaryTranslation(int vocabularyItemId, string primaryTranslation)
        {
            if (string.IsNullOrWhiteSpace(primaryTranslation))
            {
                return;
            }

            var normalizedPrimary = primaryTranslation.Trim();

            var translations = _dbContext.VocabularyItemTranslations
                .Where(x => x.VocabularyItemId == vocabularyItemId)
                .OrderBy(x => x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            if (translations.Count == 0)
            {
                return;
            }

            var hasChanges = false;

            // Remove duplicated translation rows (same text ignoring case).
            var duplicates = translations
                .GroupBy(x => x.Translation, StringComparer.OrdinalIgnoreCase)
                .Where(x => x.Count() > 1)
                .ToList();

            if (duplicates.Count > 0)
            {
                foreach (var g in duplicates)
                {
                    var keep = g
                        .OrderBy(x => x.Order)
                        .ThenBy(x => x.Id)
                        .First();

                    var remove = g
                        .Where(x => x.Id != keep.Id)
                        .ToList();

                    if (remove.Count > 0)
                    {
                        _dbContext.VocabularyItemTranslations.RemoveRange(remove);
                        hasChanges = true;
                    }
                }

                if (hasChanges)
                {
                    _dbContext.SaveChanges();

                    translations = _dbContext.VocabularyItemTranslations
                        .Where(x => x.VocabularyItemId == vocabularyItemId)
                        .OrderBy(x => x.Order)
                        .ThenBy(x => x.Id)
                        .ToList();
                }
            }

            // Ensure primary exists.
            var primaryEntity = translations
                .FirstOrDefault(x => string.Equals(x.Translation, normalizedPrimary, StringComparison.OrdinalIgnoreCase));

            if (primaryEntity == null)
            {
                // Shift all orders by +1 to keep unique index safe (Order must be unique per item).
                foreach (var t in translations)
                {
                    t.Order = t.Order + 1;
                }

                primaryEntity = new VocabularyItemTranslation
                {
                    VocabularyItemId = vocabularyItemId,
                    Translation = normalizedPrimary,
                    Order = 0
                };

                _dbContext.VocabularyItemTranslations.Add(primaryEntity);

                hasChanges = true;

                _dbContext.SaveChanges();

                translations = _dbContext.VocabularyItemTranslations
                    .Where(x => x.VocabularyItemId == vocabularyItemId)
                    .OrderBy(x => x.Order)
                    .ThenBy(x => x.Id)
                    .ToList();

                primaryEntity = translations
                    .FirstOrDefault(x => string.Equals(x.Translation, normalizedPrimary, StringComparison.OrdinalIgnoreCase));
            }

            if (primaryEntity == null)
            {
                return;
            }

            // Build a deterministic order: primary first, then others by existing Order.
            var ordered = translations
                .OrderBy(x => x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            var newOrder = new List<VocabularyItemTranslation> { primaryEntity };

            foreach (var t in ordered)
            {
                if (t.Id == primaryEntity.Id)
                {
                    continue;
                }

                newOrder.Add(t);
            }

            // Apply sequential order values (0..n-1) to guarantee unique (VocabularyItemId, Order).
            for (var i = 0; i < newOrder.Count; i++)
            {
                if (newOrder[i].Order != i)
                {
                    newOrder[i].Order = i;
                    hasChanges = true;
                }
            }

            var item = _dbContext.VocabularyItems.First(x => x.Id == vocabularyItemId);

            if (string.Equals(item.Translation, primaryEntity.Translation, StringComparison.OrdinalIgnoreCase) == false)
            {
                item.Translation = primaryEntity.Translation;
                hasChanges = true;
            }

            if (hasChanges)
            {
                _dbContext.SaveChanges();
            }
        }



        private static string? SerializeStringList(List<string>? values)
        {
            var list = values
                ?.Where(x => string.IsNullOrWhiteSpace(x) == false)
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList()
                ?? new List<string>();

            return list.Count > 0 ? JsonSerializer.Serialize(list) : null;
        }

        private static string? SerializeRelationList(List<string>? values)
        {
            var list = values
                ?.Where(x => string.IsNullOrWhiteSpace(x) == false)
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(x => new VocabularyRelationDto { Word = x, Translation = string.Empty })
                .ToList()
                ?? new List<VocabularyRelationDto>();

            return list.Count > 0 ? JsonSerializer.Serialize(list) : null;
        }

        private DateTime CalculateNextReviewAt(DateTime now, int reviewCount)
        {
            var intervals = GetFixedVocabularyReviewIntervalsDays();

            if (reviewCount <= 0)
            {
                return now;
            }

            var index = reviewCount - 1;

            var days = index < intervals.Count
                ? intervals[index]
                : intervals[intervals.Count - 1];

            return now.AddDays(days);
        }

        private static List<int> GetFixedVocabularyReviewIntervalsDays()
        {
            return new List<int> { 1, 2, 4, 7, 14, 30, 60 };
        }


        public VocabularyItemDetailsResponse GetItemDetails(int userId, int vocabularyItemId)
        {
            var item = _dbContext.VocabularyItems
                .AsNoTracking()
                .FirstOrDefault(x => x.Id == vocabularyItemId);

            if (item == null)
            {
                throw new KeyNotFoundException("Vocabulary item not found");
            }

            var translations = _dbContext.VocabularyItemTranslations
                .AsNoTracking()
                .Where(x => x.VocabularyItemId == item.Id)
                .OrderBy(x => x.Order)
                .Select(x => x.Translation)
                .ToList();

            if (translations.Count == 0 && !string.IsNullOrWhiteSpace(item.Translation))
            {
                translations.Add(item.Translation);
            }

            var examples = DeserializeOrEmpty<List<string>>(item.ExamplesJson);

            if (examples.Count == 0 && !string.IsNullOrWhiteSpace(item.Example))
            {
                examples.Add(item.Example);
            }

            return new VocabularyItemDetailsResponse
            {
                Id = item.Id,
                Word = item.Word,
                Translation = translations.FirstOrDefault() ?? string.Empty,
                Translations = translations,
                PartOfSpeech = item.PartOfSpeech,
                Definition = item.Definition,
                Transcription = item.Transcription,
                Gender = item.Gender,
                Examples = examples,
                Synonyms = DeserializeOrEmpty<List<VocabularyRelationDto>>(item.SynonymsJson),
                Idioms = DeserializeOrEmpty<List<VocabularyRelationDto>>(item.IdiomsJson)
            };
        }

        private static T DeserializeOrEmpty<T>(string? json) where T : new()
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new T();
            }

            try
            {
                var value = JsonSerializer.Deserialize<T>(json);
                return value ?? new T();
            }
            catch
            {
                return new T();
            }
        }
    }
}
