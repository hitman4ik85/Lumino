using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using System.Text.Json;

namespace Lumino.Api.Application.Services
{
    public class AdminVocabularyService : IAdminVocabularyService
    {
        private readonly LuminoDbContext _dbContext;

        public AdminVocabularyService(LuminoDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public List<AdminVocabularyItemResponse> GetAll()
        {
            var items = _dbContext.VocabularyItems
                .OrderBy(x => x.Id)
                .Select(x => new AdminVocabularyItemResponse
                {
                    Id = x.Id,
                    Word = x.Word,
                    Example = x.Example,
                    PartOfSpeech = x.PartOfSpeech,
                    Definition = x.Definition,
                    Transcription = x.Transcription,
                    Gender = x.Gender
                })
                .ToList();

            if (items.Count == 0)
            {
                return items;
            }

            var ids = items.Select(x => x.Id).ToList();

            var translations = _dbContext.VocabularyItemTranslations
                .Where(x => ids.Contains(x.VocabularyItemId))
                .OrderBy(x => x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            foreach (var item in items)
            {
                item.Translations = translations
                    .Where(x => x.VocabularyItemId == item.Id)
                    .OrderBy(x => x.Order)
                    .Select(x => x.Translation)
                    .ToList();
            }

            return items;
        }

        public AdminVocabularyItemResponse GetById(int id)
        {
            var item = _dbContext.VocabularyItems.FirstOrDefault(x => x.Id == id);

            if (item == null)
            {
                throw new KeyNotFoundException("Vocabulary item not found");
            }

            return BuildAdminResponse(item);
        }

        public AdminVocabularyItemResponse Create(CreateVocabularyItemRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var normalizedRequest = NormalizeCreateRequest(request);

            if (string.IsNullOrWhiteSpace(normalizedRequest.Word))
            {
                throw new ArgumentException("Word is required");
            }

            if (normalizedRequest.Translations == null || normalizedRequest.Translations.Count == 0)
            {
                throw new ArgumentException("Translations are required");
            }

            var cleanTranslations = normalizedRequest.Translations
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (cleanTranslations.Count == 0)
            {
                throw new ArgumentException("Translations are required");
            }

            var item = new VocabularyItem
            {
                Word = normalizedRequest.Word.Trim(),
                Translation = cleanTranslations[0],
                Example = normalizedRequest.Example,
                PartOfSpeech = normalizedRequest.PartOfSpeech,
                Definition = normalizedRequest.Definition,
                Transcription = normalizedRequest.Transcription,
                Gender = normalizedRequest.Gender,
                ExamplesJson = JsonSerializer.Serialize(normalizedRequest.Examples ?? new List<string>()),
                SynonymsJson = JsonSerializer.Serialize(normalizedRequest.Synonyms ?? new List<VocabularyRelationDto>()),
                IdiomsJson = JsonSerializer.Serialize(normalizedRequest.Idioms ?? new List<VocabularyRelationDto>())
            };

            _dbContext.VocabularyItems.Add(item);
            _dbContext.SaveChanges();

            int order = 1;

            foreach (var t in cleanTranslations)
            {
                _dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
                {
                    VocabularyItemId = item.Id,
                    Translation = t,
                    Order = order
                });

                order++;
            }

            _dbContext.SaveChanges();

            return GetById(item.Id);
        }

        public void Update(int id, UpdateVocabularyItemRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var item = _dbContext.VocabularyItems.FirstOrDefault(x => x.Id == id);

            if (item == null)
            {
                throw new KeyNotFoundException("Vocabulary item not found");
            }

            var normalizedRequest = NormalizeUpdateRequest(request);

            if (string.IsNullOrWhiteSpace(normalizedRequest.Word))
            {
                throw new ArgumentException("Word is required");
            }

            if (normalizedRequest.Translations == null || normalizedRequest.Translations.Count == 0)
            {
                throw new ArgumentException("Translations are required");
            }

            var cleanTranslations = normalizedRequest.Translations
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (cleanTranslations.Count == 0)
            {
                throw new ArgumentException("Translations are required");
            }

            item.Word = normalizedRequest.Word.Trim();
            item.Translation = cleanTranslations[0];
            item.Example = normalizedRequest.Example;
            item.PartOfSpeech = normalizedRequest.PartOfSpeech;
            item.Definition = normalizedRequest.Definition;
            item.Transcription = normalizedRequest.Transcription;
            item.Gender = normalizedRequest.Gender;
            item.ExamplesJson = JsonSerializer.Serialize(normalizedRequest.Examples ?? new List<string>());
            item.SynonymsJson = JsonSerializer.Serialize(normalizedRequest.Synonyms ?? new List<VocabularyRelationDto>());
            item.IdiomsJson = JsonSerializer.Serialize(normalizedRequest.Idioms ?? new List<VocabularyRelationDto>());

            var existingTranslations = _dbContext.VocabularyItemTranslations
                .Where(x => x.VocabularyItemId == id)
                .ToList();

            if (existingTranslations.Count > 0)
            {
                _dbContext.VocabularyItemTranslations.RemoveRange(existingTranslations);
            }

            _dbContext.SaveChanges();

            int order = 1;

            foreach (var t in cleanTranslations)
            {
                _dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
                {
                    VocabularyItemId = id,
                    Translation = t,
                    Order = order
                });

                order++;
            }

            _dbContext.SaveChanges();
        }

        public void Delete(int id)
        {
            var item = _dbContext.VocabularyItems.FirstOrDefault(x => x.Id == id);

            if (item == null)
            {
                throw new KeyNotFoundException("Vocabulary item not found");
            }

            _dbContext.VocabularyItems.Remove(item);
            _dbContext.SaveChanges();
        }

        public void LinkToLesson(int lessonId, int vocabularyItemId)
        {
            var lessonExists = _dbContext.Lessons.Any(x => x.Id == lessonId);

            if (!lessonExists)
            {
                throw new KeyNotFoundException("Lesson not found");
            }

            var vocabExists = _dbContext.VocabularyItems.Any(x => x.Id == vocabularyItemId);

            if (!vocabExists)
            {
                throw new KeyNotFoundException("Vocabulary item not found");
            }

            bool exists = _dbContext.LessonVocabularies
                .Any(x => x.LessonId == lessonId && x.VocabularyItemId == vocabularyItemId);

            if (exists)
            {
                return;
            }

            _dbContext.LessonVocabularies.Add(new LessonVocabulary
            {
                LessonId = lessonId,
                VocabularyItemId = vocabularyItemId
            });

            _dbContext.SaveChanges();
        }

        public void UnlinkFromLesson(int lessonId, int vocabularyItemId)
        {
            var link = _dbContext.LessonVocabularies
                .FirstOrDefault(x => x.LessonId == lessonId && x.VocabularyItemId == vocabularyItemId);

            if (link == null)
            {
                return;
            }

            _dbContext.LessonVocabularies.Remove(link);
            _dbContext.SaveChanges();
        }

        public List<AdminVocabularyItemResponse> GetByLesson(int lessonId)
        {
            var lessonExists = _dbContext.Lessons.Any(x => x.Id == lessonId);

            if (!lessonExists)
            {
                throw new KeyNotFoundException("Lesson not found");
            }

            var ids = _dbContext.LessonVocabularies
                .Where(x => x.LessonId == lessonId)
                .Select(x => x.VocabularyItemId)
                .Distinct()
                .ToList();

            if (ids.Count == 0)
            {
                return new List<AdminVocabularyItemResponse>();
            }

            var items = _dbContext.VocabularyItems
                .Where(x => ids.Contains(x.Id))
                .Select(x => new AdminVocabularyItemResponse
                {
                    Id = x.Id,
                    Word = x.Word,
                    Example = x.Example,
                    PartOfSpeech = x.PartOfSpeech,
                    Definition = x.Definition,
                    Transcription = x.Transcription,
                    Gender = x.Gender
                })
                .ToList();

            var translations = _dbContext.VocabularyItemTranslations
                .Where(x => ids.Contains(x.VocabularyItemId))
                .OrderBy(x => x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            foreach (var item in items)
            {
                item.Translations = translations
                    .Where(x => x.VocabularyItemId == item.Id)
                    .OrderBy(x => x.Order)
                    .Select(x => x.Translation)
                    .ToList();
            }

            return items;
        }

        public List<AdminVocabularyItemResponse> GetByCourseLanguage(int courseId)
        {
            var course = _dbContext.Courses.FirstOrDefault(x => x.Id == courseId);

            if (course == null)
            {
                throw new KeyNotFoundException("Course not found");
            }

            var languageCode = (course.LanguageCode ?? string.Empty).Trim().ToLower();

            if (string.IsNullOrWhiteSpace(languageCode))
            {
                return new List<AdminVocabularyItemResponse>();
            }

            var courseIds = _dbContext.Courses
                .Where(x => (x.LanguageCode ?? string.Empty).Trim().ToLower() == languageCode)
                .Select(x => x.Id)
                .ToList();

            if (courseIds.Count == 0)
            {
                return new List<AdminVocabularyItemResponse>();
            }

            var topicIds = _dbContext.Topics
                .Where(x => courseIds.Contains(x.CourseId))
                .Select(x => x.Id)
                .ToList();

            if (topicIds.Count == 0)
            {
                return new List<AdminVocabularyItemResponse>();
            }

            var lessonIds = _dbContext.Lessons
                .Where(x => topicIds.Contains(x.TopicId))
                .Select(x => x.Id)
                .ToList();

            if (lessonIds.Count == 0)
            {
                return new List<AdminVocabularyItemResponse>();
            }

            var ids = _dbContext.LessonVocabularies
                .Where(x => lessonIds.Contains(x.LessonId))
                .Select(x => x.VocabularyItemId)
                .Distinct()
                .ToList();

            if (ids.Count == 0)
            {
                return new List<AdminVocabularyItemResponse>();
            }

            var items = _dbContext.VocabularyItems
                .Where(x => ids.Contains(x.Id))
                .Select(x => new AdminVocabularyItemResponse
                {
                    Id = x.Id,
                    Word = x.Word,
                    Example = x.Example,
                    PartOfSpeech = x.PartOfSpeech,
                    Definition = x.Definition,
                    Transcription = x.Transcription,
                    Gender = x.Gender
                })
                .ToList();

            var translations = _dbContext.VocabularyItemTranslations
                .Where(x => ids.Contains(x.VocabularyItemId))
                .OrderBy(x => x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            foreach (var item in items)
            {
                item.Translations = translations
                    .Where(x => x.VocabularyItemId == item.Id)
                    .OrderBy(x => x.Order)
                    .Select(x => x.Translation)
                    .ToList();
            }

            return items
                .OrderBy(x => (x.Word ?? string.Empty).Trim(), StringComparer.OrdinalIgnoreCase)
                .ThenBy(x => x.Translations.FirstOrDefault() ?? string.Empty, StringComparer.OrdinalIgnoreCase)
                .ThenBy(x => x.Id)
                .ToList();
        }

        public AdminVocabularyExportResponse Export(AdminVocabularyExportRequest request)
        {
            var ids = (request?.Ids ?? new List<int>())
                .Select(x => x)
                .Where(x => x > 0)
                .Distinct()
                .ToList();

            var response = new AdminVocabularyExportResponse
            {
                ExportedAt = DateTime.UtcNow
            };

            if (ids.Count == 0)
            {
                return response;
            }

            response.Items = ids
                .Select(id => _dbContext.VocabularyItems.FirstOrDefault(x => x.Id == id))
                .Where(x => x != null)
                .Select(x => BuildAdminResponse(x!))
                .OrderBy(x => x.Word ?? string.Empty, StringComparer.OrdinalIgnoreCase)
                .ThenBy(x => x.Translations.FirstOrDefault() ?? string.Empty, StringComparer.OrdinalIgnoreCase)
                .ThenBy(x => x.Id)
                .ToList();

            return response;
        }

        public AdminVocabularyImportResponse Import(AdminVocabularyImportRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var response = new AdminVocabularyImportResponse();
            var importItems = ExpandImportItems(request.Items ?? new List<CreateVocabularyItemRequest>());

            foreach (var sourceItem in importItems)
            {
                var normalizedItem = NormalizeCreateRequest(sourceItem);

                if (string.IsNullOrWhiteSpace(normalizedItem.Word) || normalizedItem.Translations.Count == 0)
                {
                    response.SkippedCount++;
                    continue;
                }

                var existingEntity = _dbContext.VocabularyItems
                    .AsEnumerable()
                    .FirstOrDefault(x => AreWordsEquivalent(x.Word, normalizedItem.Word));

                if (existingEntity == null)
                {
                    var created = Create(normalizedItem);
                    response.CreatedCount++;
                    response.Items.Add(created);
                    continue;
                }

                var existing = BuildAdminResponse(existingEntity);
                var merged = BuildMergedRequest(existing, normalizedItem);

                if (AreEquivalent(existing, merged))
                {
                    response.SkippedCount++;
                    response.Items.Add(existing);
                    continue;
                }

                Update(existingEntity.Id, merged);
                response.UpdatedCount++;
                response.Items.Add(GetById(existingEntity.Id));
            }

            response.Items = response.Items
                .GroupBy(x => x.Id)
                .Select(x => x.Last())
                .OrderBy(x => x.Word ?? string.Empty, StringComparer.OrdinalIgnoreCase)
                .ThenBy(x => x.Translations.FirstOrDefault() ?? string.Empty, StringComparer.OrdinalIgnoreCase)
                .ThenBy(x => x.Id)
                .ToList();

            return response;
        }

        private AdminVocabularyItemResponse BuildAdminResponse(VocabularyItem item)
        {
            var translations = _dbContext.VocabularyItemTranslations
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

            return new AdminVocabularyItemResponse
            {
                Id = item.Id,
                Word = item.Word,
                Example = item.Example,
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

        private static CreateVocabularyItemRequest NormalizeCreateRequest(CreateVocabularyItemRequest request)
        {
            var examples = NormalizeTextList(request.Examples, trimTrailingPunctuation: false);
            var primaryExample = NormalizeDisplayText(request.Example);

            if (string.IsNullOrWhiteSpace(primaryExample) && examples.Count > 0)
            {
                primaryExample = examples[0];
            }

            if (!string.IsNullOrWhiteSpace(primaryExample)
                && examples.Count == 0)
            {
                examples.Add(primaryExample);
            }

            return new CreateVocabularyItemRequest
            {
                Word = NormalizeDisplayText(request.Word, trimTrailingPunctuation: true),
                Translations = NormalizeTextList(request.Translations),
                Example = NullIfWhiteSpace(primaryExample),
                PartOfSpeech = NullIfWhiteSpace(NormalizeDisplayText(request.PartOfSpeech)),
                Definition = NullIfWhiteSpace(NormalizeDisplayText(request.Definition)),
                Transcription = NullIfWhiteSpace(NormalizeDisplayText(request.Transcription)),
                Gender = NullIfWhiteSpace(NormalizeDisplayText(request.Gender)),
                Examples = examples,
                Synonyms = NormalizeRelationList(request.Synonyms),
                Idioms = NormalizeRelationList(request.Idioms)
            };
        }

        private static UpdateVocabularyItemRequest NormalizeUpdateRequest(UpdateVocabularyItemRequest request)
        {
            var normalized = NormalizeCreateRequest(new CreateVocabularyItemRequest
            {
                Word = request.Word,
                Translations = request.Translations,
                Example = request.Example,
                PartOfSpeech = request.PartOfSpeech,
                Definition = request.Definition,
                Transcription = request.Transcription,
                Gender = request.Gender,
                Examples = request.Examples,
                Synonyms = request.Synonyms,
                Idioms = request.Idioms
            });

            return new UpdateVocabularyItemRequest
            {
                Word = normalized.Word,
                Translations = normalized.Translations,
                Example = normalized.Example,
                PartOfSpeech = normalized.PartOfSpeech,
                Definition = normalized.Definition,
                Transcription = normalized.Transcription,
                Gender = normalized.Gender,
                Examples = normalized.Examples,
                Synonyms = normalized.Synonyms,
                Idioms = normalized.Idioms
            };
        }

        private static UpdateVocabularyItemRequest BuildMergedRequest(AdminVocabularyItemResponse existing, CreateVocabularyItemRequest imported)
        {
            var mergedWord = ShouldReplaceDisplayText(existing.Word, imported.Word)
                ? imported.Word
                : NormalizeDisplayText(existing.Word, trimTrailingPunctuation: true);

            var mergedTranslations = MergeTextLists(existing.Translations, imported.Translations);
            var mergedExamples = MergeTextLists(existing.Examples, imported.Examples);
            var mergedExample = ResolveMergedExample(existing.Example, imported.Example, mergedExamples);

            return NormalizeUpdateRequest(new UpdateVocabularyItemRequest
            {
                Word = mergedWord,
                Translations = mergedTranslations,
                Example = mergedExample,
                PartOfSpeech = MergeScalar(existing.PartOfSpeech, imported.PartOfSpeech),
                Definition = MergeScalar(existing.Definition, imported.Definition),
                Transcription = MergeScalar(existing.Transcription, imported.Transcription),
                Gender = MergeScalar(existing.Gender, imported.Gender),
                Examples = mergedExamples,
                Synonyms = MergeRelationLists(existing.Synonyms, imported.Synonyms),
                Idioms = MergeRelationLists(existing.Idioms, imported.Idioms)
            });
        }

        private static bool AreEquivalent(AdminVocabularyItemResponse existing, UpdateVocabularyItemRequest request)
        {
            if (!string.Equals(NormalizeLookupText(existing.Word), NormalizeLookupText(request.Word), StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            if (!string.Equals(NormalizeLookupText(existing.Example), NormalizeLookupText(request.Example), StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            if (!string.Equals(NormalizeLookupText(existing.PartOfSpeech), NormalizeLookupText(request.PartOfSpeech), StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            if (!string.Equals(NormalizeLookupText(existing.Definition), NormalizeLookupText(request.Definition), StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            if (!string.Equals(NormalizeLookupText(existing.Transcription), NormalizeLookupText(request.Transcription), StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            if (!string.Equals(NormalizeLookupText(existing.Gender), NormalizeLookupText(request.Gender), StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            if (!AreTextListsEquivalent(existing.Translations, request.Translations))
            {
                return false;
            }

            if (!AreTextListsEquivalent(existing.Examples, request.Examples))
            {
                return false;
            }

            if (!AreRelationListsEquivalent(existing.Synonyms, request.Synonyms))
            {
                return false;
            }

            return AreRelationListsEquivalent(existing.Idioms, request.Idioms);
        }

        private static bool AreTextListsEquivalent(List<string>? left, List<string>? right)
        {
            var normalizedLeft = NormalizeTextList(left);
            var normalizedRight = NormalizeTextList(right);

            if (normalizedLeft.Count != normalizedRight.Count)
            {
                return false;
            }

            for (int i = 0; i < normalizedLeft.Count; i++)
            {
                if (!string.Equals(NormalizeLookupText(normalizedLeft[i]), NormalizeLookupText(normalizedRight[i]), StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }
            }

            return true;
        }

        private static bool AreRelationListsEquivalent(List<VocabularyRelationDto>? left, List<VocabularyRelationDto>? right)
        {
            var normalizedLeft = NormalizeRelationList(left);
            var normalizedRight = NormalizeRelationList(right);

            if (normalizedLeft.Count != normalizedRight.Count)
            {
                return false;
            }

            for (int i = 0; i < normalizedLeft.Count; i++)
            {
                if (!string.Equals(NormalizeLookupText(normalizedLeft[i].Word), NormalizeLookupText(normalizedRight[i].Word), StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                if (!string.Equals(NormalizeLookupText(normalizedLeft[i].Translation), NormalizeLookupText(normalizedRight[i].Translation), StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }
            }

            return true;
        }

        private static string MergeScalar(string? existing, string? imported)
        {
            var normalizedExisting = NullIfWhiteSpace(NormalizeDisplayText(existing));
            var normalizedImported = NullIfWhiteSpace(NormalizeDisplayText(imported));

            if (string.IsNullOrWhiteSpace(normalizedExisting))
            {
                return normalizedImported ?? string.Empty;
            }

            return normalizedExisting;
        }

        private static string? ResolveMergedExample(string? existing, string? imported, List<string> mergedExamples)
        {
            var normalizedExisting = NullIfWhiteSpace(NormalizeDisplayText(existing));
            var normalizedImported = NullIfWhiteSpace(NormalizeDisplayText(imported));

            if (!string.IsNullOrWhiteSpace(normalizedExisting))
            {
                return normalizedExisting;
            }

            if (!string.IsNullOrWhiteSpace(normalizedImported))
            {
                return normalizedImported;
            }

            return mergedExamples.FirstOrDefault();
        }

        private static bool ShouldReplaceDisplayText(string? existing, string? imported)
        {
            var normalizedImported = NullIfWhiteSpace(NormalizeDisplayText(imported, trimTrailingPunctuation: true));

            if (string.IsNullOrWhiteSpace(normalizedImported))
            {
                return false;
            }

            var normalizedExisting = NullIfWhiteSpace(NormalizeDisplayText(existing, trimTrailingPunctuation: true));

            if (string.IsNullOrWhiteSpace(normalizedExisting))
            {
                return true;
            }

            return string.Equals(NormalizeLookupText(normalizedExisting), NormalizeLookupText(normalizedImported), StringComparison.OrdinalIgnoreCase)
                && !string.Equals(normalizedExisting, normalizedImported, StringComparison.Ordinal);
        }

        private static List<string> MergeTextLists(List<string>? existing, List<string>? imported)
        {
            var result = new List<string>();

            foreach (var item in NormalizeTextList(existing))
            {
                AddUniqueText(result, item);
            }

            foreach (var item in NormalizeTextList(imported))
            {
                AddUniqueText(result, item);
            }

            return result;
        }

        private static void AddUniqueText(List<string> result, string value)
        {
            var normalizedValue = NormalizeLookupText(value);

            if (string.IsNullOrWhiteSpace(normalizedValue))
            {
                return;
            }

            if (!result.Any(x => string.Equals(NormalizeLookupText(x), normalizedValue, StringComparison.OrdinalIgnoreCase)))
            {
                result.Add(value);
            }
        }

        private static List<VocabularyRelationDto> MergeRelationLists(List<VocabularyRelationDto>? existing, List<VocabularyRelationDto>? imported)
        {
            var result = NormalizeRelationList(existing);

            foreach (var item in NormalizeRelationList(imported))
            {
                var existingIndex = result.FindIndex(x => string.Equals(NormalizeLookupText(x.Word), NormalizeLookupText(item.Word), StringComparison.OrdinalIgnoreCase));

                if (existingIndex >= 0)
                {
                    if (string.IsNullOrWhiteSpace(result[existingIndex].Translation) && !string.IsNullOrWhiteSpace(item.Translation))
                    {
                        result[existingIndex].Translation = item.Translation;
                    }

                    continue;
                }

                result.Add(new VocabularyRelationDto
                {
                    Word = item.Word,
                    Translation = item.Translation
                });
            }

            return result;
        }

        private static List<VocabularyRelationDto> NormalizeRelationList(List<VocabularyRelationDto>? values)
        {
            var result = new List<VocabularyRelationDto>();

            foreach (var item in values ?? new List<VocabularyRelationDto>())
            {
                var word = NullIfWhiteSpace(NormalizeDisplayText(item?.Word));
                var translation = NullIfWhiteSpace(NormalizeDisplayText(item?.Translation));

                if (string.IsNullOrWhiteSpace(word))
                {
                    continue;
                }

                var existingIndex = result.FindIndex(x => string.Equals(NormalizeLookupText(x.Word), NormalizeLookupText(word), StringComparison.OrdinalIgnoreCase));

                if (existingIndex >= 0)
                {
                    if (string.IsNullOrWhiteSpace(result[existingIndex].Translation) && !string.IsNullOrWhiteSpace(translation))
                    {
                        result[existingIndex].Translation = translation;
                    }

                    continue;
                }

                result.Add(new VocabularyRelationDto
                {
                    Word = word,
                    Translation = translation ?? string.Empty
                });
            }

            return result;
        }

        private static List<string> NormalizeTextList(List<string>? values, bool trimTrailingPunctuation = true)
        {
            var result = new List<string>();

            foreach (var item in values ?? new List<string>())
            {
                var normalized = NullIfWhiteSpace(NormalizeDisplayText(item, trimTrailingPunctuation));

                if (string.IsNullOrWhiteSpace(normalized))
                {
                    continue;
                }

                AddUniqueText(result, normalized);
            }

            return result;
        }

        private static List<CreateVocabularyItemRequest> ExpandImportItems(List<CreateVocabularyItemRequest>? values)
        {
            var result = new List<CreateVocabularyItemRequest>();

            foreach (var item in values ?? new List<CreateVocabularyItemRequest>())
            {
                if (item == null)
                {
                    continue;
                }

                var normalizedItem = NormalizeCreateRequest(item);
                var primaryTranslation = normalizedItem.Translations.FirstOrDefault() ?? string.Empty;

                if (TrySplitPairedVariants(normalizedItem.Word, primaryTranslation, out var pairs))
                {
                    foreach (var pair in pairs)
                    {
                        result.Add(new CreateVocabularyItemRequest
                        {
                            Word = pair.Word,
                            Translations = new List<string> { pair.Translation },
                            Example = normalizedItem.Example,
                            PartOfSpeech = normalizedItem.PartOfSpeech,
                            Definition = normalizedItem.Definition,
                            Transcription = normalizedItem.Transcription,
                            Gender = normalizedItem.Gender,
                            Examples = normalizedItem.Examples,
                            Synonyms = normalizedItem.Synonyms,
                            Idioms = normalizedItem.Idioms
                        });
                    }

                    continue;
                }

                result.Add(normalizedItem);
            }

            return result;
        }

        private static bool TrySplitPairedVariants(string? word, string? translation, out List<(string Word, string Translation)> pairs)
        {
            pairs = new List<(string Word, string Translation)>();

            var wordVariants = ExpandSlashVariants(word);
            var translationVariants = ExpandSlashVariants(translation);

            if (wordVariants.Count <= 1 || translationVariants.Count <= 1)
            {
                return false;
            }

            if (wordVariants.Count != translationVariants.Count)
            {
                return false;
            }

            for (int i = 0; i < wordVariants.Count; i++)
            {
                var currentWord = NullIfWhiteSpace(NormalizeDisplayText(wordVariants[i], trimTrailingPunctuation: true));
                var currentTranslation = NullIfWhiteSpace(NormalizeDisplayText(translationVariants[i], trimTrailingPunctuation: true));

                if (string.IsNullOrWhiteSpace(currentWord) || string.IsNullOrWhiteSpace(currentTranslation))
                {
                    continue;
                }

                pairs.Add((currentWord, currentTranslation));
            }

            return pairs.Count > 1;
        }

        private static List<string> ExpandSlashVariants(string? value)
        {
            var normalized = NullIfWhiteSpace(NormalizeDisplayText(value, trimTrailingPunctuation: true));

            if (string.IsNullOrWhiteSpace(normalized))
            {
                return new List<string>();
            }

            if (!normalized.Contains('/') && !normalized.Contains('|'))
            {
                return new List<string> { normalized };
            }

            var separator = normalized.Contains('/') ? '/' : '|';
            var parts = normalized
                .Split(new[] { separator }, StringSplitOptions.RemoveEmptyEntries)
                .Select(x => NormalizeDisplayText(x, trimTrailingPunctuation: true))
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToList();

            if (parts.Count == 2)
            {
                var left = parts[0];
                var right = parts[1];

                if (left.Contains(' ') && !right.Contains(' '))
                {
                    var lastSpaceIndex = left.LastIndexOf(' ');

                    if (lastSpaceIndex > 0)
                    {
                        var prefix = left.Substring(0, lastSpaceIndex).Trim();
                        var first = left;
                        var second = string.IsNullOrWhiteSpace(prefix) ? right : $"{prefix} {right}";
                        return new List<string> { first, NormalizeDisplayText(second, trimTrailingPunctuation: true) };
                    }
                }
            }

            return parts;
        }

        private static bool AreWordsEquivalent(string? left, string? right)
        {
            return string.Equals(NormalizeLookupText(left), NormalizeLookupText(right), StringComparison.OrdinalIgnoreCase);
        }

        private static string NormalizeLookupText(string? value)
        {
            var normalized = NormalizeDisplayText(value, trimTrailingPunctuation: true) ?? string.Empty;
            return normalized.Trim().ToLowerInvariant();
        }

        private static string NormalizeDisplayText(string? value, bool trimTrailingPunctuation = false)
        {
            var normalized = (value ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(normalized))
            {
                return string.Empty;
            }

            normalized = string.Join(' ', normalized
                .Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries));

            if (!trimTrailingPunctuation)
            {
                return normalized;
            }

            normalized = normalized.TrimEnd('.', ',', ';', ':', '!', '?');

            if (normalized.EndsWith("вЂ¦", StringComparison.Ordinal))
            {
                normalized = normalized.Substring(0, normalized.Length - 1);
            }

            return normalized;
        }

        private static string? NullIfWhiteSpace(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value;
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
