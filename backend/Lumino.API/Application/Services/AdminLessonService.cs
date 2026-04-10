using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;
using Lumino.Api.Utils;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Lumino.Api.Application.Services
{
    public class AdminLessonService : IAdminLessonService
    {
        private readonly LuminoDbContext _dbContext;

        public AdminLessonService(LuminoDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public List<AdminLessonResponse> GetByTopic(int topicId)
        {
            return _dbContext.Lessons
                .Where(x => x.TopicId == topicId)
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .Select(x => new AdminLessonResponse
                {
                    Id = x.Id,
                    TopicId = x.TopicId,
                    Title = x.Title,
                    Theory = x.Theory,
                    Order = x.Order
                })
                .ToList();
        }

        public AdminLessonDetailsResponse GetById(int id)
        {
            var lesson = _dbContext.Lessons.FirstOrDefault(x => x.Id == id);

            if (lesson == null)
            {
                throw new KeyNotFoundException("Lesson not found");
            }

            var exercises = _dbContext.Exercises
                .Where(x => x.LessonId == id)
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .Select(x => new AdminExerciseResponse
                {
                    Id = x.Id,
                    LessonId = x.LessonId,
                    Type = x.Type.ToString(),
                    Question = x.Question,
                    Data = x.Data,
                    CorrectAnswer = x.CorrectAnswer,
                    Order = x.Order,
                    ImageUrl = NormalizeImageUrl(x.ImageUrl)
                })
                .ToList();

            var vocabIds = _dbContext.LessonVocabularies
                .Where(x => x.LessonId == id)
                .Select(x => x.VocabularyItemId)
                .Distinct()
                .ToList();

            var vocabItems = new List<AdminVocabularyItemResponse>();

            if (vocabIds.Count > 0)
            {
                vocabItems = _dbContext.VocabularyItems
                    .Where(x => vocabIds.Contains(x.Id))
                    .Select(x => new AdminVocabularyItemResponse
                    {
                        Id = x.Id,
                        Word = x.Word,
                        Example = x.Example
                    })
                    .ToList();

                var translations = _dbContext.VocabularyItemTranslations
                    .Where(x => vocabIds.Contains(x.VocabularyItemId))
                    .OrderBy(x => x.Order)
                    .ThenBy(x => x.Id)
                    .ToList();

                foreach (var item in vocabItems)
                {
                    item.Translations = translations
                        .Where(x => x.VocabularyItemId == item.Id)
                        .OrderBy(x => x.Order)
                        .Select(x => x.Translation)
                        .ToList();
                }
            }

            return new AdminLessonDetailsResponse
            {
                Id = lesson.Id,
                TopicId = lesson.TopicId,
                Title = lesson.Title,
                Theory = lesson.Theory,
                Order = lesson.Order,
                ExercisesCount = exercises.Count,
                Exercises = exercises,
                Vocabulary = vocabItems
            };
        }

        public AdminLessonDetailsResponse Copy(int id, CopyItemRequest? request)
        {
            var source = _dbContext.Lessons.FirstOrDefault(x => x.Id == id);

            if (source == null)
            {
                throw new KeyNotFoundException("Lesson not found");
            }

            int targetTopicId = request?.TargetTopicId ?? source.TopicId;

            var topicExists = _dbContext.Topics.Any(x => x.Id == targetTopicId);

            if (!topicExists)
            {
                throw new KeyNotFoundException("Target topic not found");
            }

            EnsureTopicHasLessonSlot(targetTopicId);


            var suffix = string.IsNullOrWhiteSpace(request?.TitleSuffix)
                ? " (Copy)"
                : request!.TitleSuffix!.Trim();

            if (!suffix.StartsWith(" "))
            {
                suffix = " " + suffix;
            }
            var useTransaction = _dbContext.Database.ProviderName == null ||
                                             !_dbContext.Database.ProviderName.Contains("InMemory", StringComparison.OrdinalIgnoreCase);

            using var transaction = useTransaction ? _dbContext.Database.BeginTransaction() : null;

            try
            {
                var newLesson = new Lesson
                {
                    TopicId = targetTopicId,
                    Title = source.Title + suffix,
                    Theory = source.Theory,
                    Order = GetNextAvailableLessonOrder(targetTopicId)
                };

                _dbContext.Lessons.Add(newLesson);
                _dbContext.SaveChanges();

                var exercises = _dbContext.Exercises
                    .Where(x => x.LessonId == source.Id)
                    .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                    .ThenBy(x => x.Id)
                    .ToList();

                foreach (var ex in exercises)
                {
                    _dbContext.Exercises.Add(new Exercise
                    {
                        LessonId = newLesson.Id,
                        Type = ex.Type,
                        Question = ex.Question,
                        Data = ex.Data,
                        CorrectAnswer = ex.CorrectAnswer,
                        Order = ex.Order,
                        ImageUrl = NormalizeImageUrl(ex.ImageUrl)
                    });
                }

                var vocabLinks = _dbContext.LessonVocabularies
                    .Where(x => x.LessonId == source.Id)
                    .ToList();

                foreach (var link in vocabLinks)
                {
                    _dbContext.LessonVocabularies.Add(new LessonVocabulary
                    {
                        LessonId = newLesson.Id,
                        VocabularyItemId = link.VocabularyItemId
                    });
                }

                _dbContext.SaveChanges();

                var courseId = GetCourseIdByTopicId(targetTopicId);
                CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, courseId);

                transaction?.Commit();

                return GetById(newLesson.Id);
            }
            catch
            {
                transaction?.Rollback();
                throw;
            }
        }

        public List<ExportExerciseJson> ExportExercises(int lessonId)
        {
            var lessonExists = _dbContext.Lessons.Any(x => x.Id == lessonId);

            if (!lessonExists)
            {
                throw new KeyNotFoundException("Lesson not found");
            }

            return _dbContext.Exercises
                .Where(x => x.LessonId == lessonId)
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .Select(x => new ExportExerciseJson
                {
                    Type = x.Type.ToString(),
                    Question = x.Question,
                    Data = x.Data,
                    CorrectAnswer = x.CorrectAnswer,
                    Order = x.Order,
                    ImageUrl = NormalizeImageUrl(x.ImageUrl)
                })
                .ToList();
        }

        public AdminLessonDetailsResponse ImportExercises(int lessonId, ImportExercisesRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var lesson = _dbContext.Lessons.FirstOrDefault(x => x.Id == lessonId);

            if (lesson == null)
            {
                throw new KeyNotFoundException("Lesson not found");
            }

            if (request.Exercises == null || request.Exercises.Count == 0)
            {
                throw new ArgumentException("Exercises are required");
            }

            var useTransaction = _dbContext.Database.ProviderName == null ||
                                 !_dbContext.Database.ProviderName.Contains("InMemory", StringComparison.OrdinalIgnoreCase);

            using var transaction = useTransaction ? _dbContext.Database.BeginTransaction() : null;

            try
            {
                if (request.ReplaceExisting)
                {
                    var existing = _dbContext.Exercises.Where(x => x.LessonId == lessonId).ToList();

                    if (existing.Count > 0)
                    {
                        _dbContext.Exercises.RemoveRange(existing);
                        _dbContext.SaveChanges();
                    }
                }

                var existingExercisesCount = request.ReplaceExisting
                    ? 0
                    : _dbContext.Exercises.Count(x => x.LessonId == lessonId);

                var incomingExercisesCount = request.Exercises.Count(x => x != null);

                if (existingExercisesCount + incomingExercisesCount > CourseStructureLimits.ExercisesPerLesson)
                {
                    throw new ArgumentException($"Lesson can contain at most {CourseStructureLimits.ExercisesPerLesson} exercises");
                }

                var usedOrders = new HashSet<int>();

                foreach (var ex in request.Exercises)
                {
                    if (ex == null)
                    {
                        continue;
                    }

                    int order = NormalizeOrder(ex.Order);

                    ValidateExerciseOrderRange(order);
                    ValidateExercise(ex.Type, ex.Question, ex.Data, ex.CorrectAnswer);

                    if (order > 0)
                    {
                        if (usedOrders.Contains(order))
                        {
                            throw new ArgumentException("Exercise with this Order already exists in this import");
                        }

                        bool exists = _dbContext.Exercises.Any(x => x.LessonId == lessonId && x.Order == order);

                        if (exists)
                        {
                            throw new ArgumentException("Exercise with this Order already exists in this lesson");
                        }

                        usedOrders.Add(order);
                    }

                    if (!Enum.TryParse<ExerciseType>(ex.Type, out var exerciseType))
                    {
                        throw new ArgumentException("Type is invalid");
                    }

                    _dbContext.Exercises.Add(new Exercise
                    {
                        LessonId = lessonId,
                        Type = exerciseType,
                        Question = ex.Question,
                        Data = ex.Data,
                        CorrectAnswer = ex.CorrectAnswer,
                        Order = order,
                        ImageUrl = NormalizeImageUrl(ex.ImageUrl)
                    });
                }

                _dbContext.SaveChanges();

                var courseId = GetCourseIdByLessonId(lessonId);
                CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, courseId);

                transaction?.Commit();

                return GetById(lessonId);
            }
            catch
            {
                transaction?.Rollback();
                throw;
            }
        }

        public AdminLessonResponse Create(CreateLessonRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            EnsureTopicHasLessonSlot(request.TopicId);

            var order = NormalizeOrder(request.Order);

            ValidateLessonOrderRange(order);
            ValidateUniqueLessonOrder(request.TopicId, order, ignoreLessonId: null);

            var lesson = new Lesson
            {
                TopicId = request.TopicId,
                Title = request.Title,
                Theory = request.Theory,
                Order = order
            };

            _dbContext.Lessons.Add(lesson);
            _dbContext.SaveChanges();

            var courseId = GetCourseIdByTopicId(lesson.TopicId);
            CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, courseId);

            return new AdminLessonResponse
            {
                Id = lesson.Id,
                TopicId = lesson.TopicId,
                Title = lesson.Title,
                Theory = lesson.Theory,
                Order = lesson.Order
            };
        }

        public void Update(int id, UpdateLessonRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var lesson = _dbContext.Lessons.FirstOrDefault(x => x.Id == id);

            if (lesson == null)
            {
                throw new KeyNotFoundException("Lesson not found");
            }

            var order = NormalizeOrder(request.Order);

            ValidateLessonOrderRange(order);
            ValidateUniqueLessonOrder(lesson.TopicId, order, ignoreLessonId: lesson.Id);

            lesson.Title = request.Title;
            lesson.Theory = request.Theory;
            lesson.Order = order;

            _dbContext.SaveChanges();

            var courseId = GetCourseIdByTopicId(lesson.TopicId);
            CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, courseId);
        }

        public void Delete(int id)
        {
            var lesson = _dbContext.Lessons.FirstOrDefault(x => x.Id == id);

            if (lesson == null)
            {
                throw new KeyNotFoundException("Lesson not found");
            }

            var courseId = GetCourseIdByTopicId(lesson.TopicId);

            _dbContext.Lessons.Remove(lesson);
            _dbContext.SaveChanges();

            CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, courseId);
        }


        private int? GetCourseIdByLessonId(int lessonId)
        {
            var topicId = _dbContext.Lessons
                .Where(x => x.Id == lessonId)
                .Select(x => (int?)x.TopicId)
                .FirstOrDefault();

            if (!topicId.HasValue)
            {
                return null;
            }

            return GetCourseIdByTopicId(topicId.Value);
        }

        private int? GetCourseIdByTopicId(int topicId)
        {
            return _dbContext.Topics
                .Where(x => x.Id == topicId)
                .Select(x => (int?)x.CourseId)
                .FirstOrDefault();
        }

        private static string? NormalizeImageUrl(string? imageUrl)
        {
            return MediaUrlResolver.NormalizeLessonImageUrl(imageUrl);
        }

        private int NormalizeOrder(int order)
        {
            return order < 0 ? 0 : order;
        }

        private void EnsureTopicHasLessonSlot(int topicId)
        {
            var lessonsCount = _dbContext.Lessons.Count(x => x.TopicId == topicId);

            if (lessonsCount >= CourseStructureLimits.LessonsPerTopic)
            {
                throw new ArgumentException($"Topic can contain at most {CourseStructureLimits.LessonsPerTopic} lessons");
            }
        }

        private void ValidateLessonOrderRange(int order)
        {
            if (order <= 0)
            {
                return;
            }

            if (order > CourseStructureLimits.LessonsPerTopic)
            {
                throw new ArgumentException($"Lesson Order must be between 1 and {CourseStructureLimits.LessonsPerTopic}");
            }
        }

        private void ValidateUniqueLessonOrder(int topicId, int order, int? ignoreLessonId)
        {
            if (order <= 0)
            {
                return;
            }

            var hasDuplicate = _dbContext.Lessons.Any(x =>
                x.TopicId == topicId &&
                x.Order == order &&
                (ignoreLessonId == null || x.Id != ignoreLessonId));

            if (hasDuplicate)
            {
                throw new ArgumentException("Order is already used in this topic");
            }
        }

        private int GetNextAvailableLessonOrder(int topicId)
        {
            var usedOrders = _dbContext.Lessons
                .Where(x => x.TopicId == topicId && x.Order > 0)
                .Select(x => x.Order)
                .Distinct()
                .ToHashSet();

            for (int order = 1; order <= CourseStructureLimits.LessonsPerTopic; order++)
            {
                if (!usedOrders.Contains(order))
                {
                    return order;
                }
            }

            return 0;
        }

        private void ValidateExerciseOrderRange(int order)
        {
            if (order <= 0)
            {
                return;
            }

            if (order > CourseStructureLimits.ExercisesPerLesson)
            {
                throw new ArgumentException($"Exercise Order must be between 1 and {CourseStructureLimits.ExercisesPerLesson}");
            }
        }

        private static void ValidateExercise(string type, string question, string data, string correctAnswer)
        {
            if (string.IsNullOrWhiteSpace(type))
            {
                throw new ArgumentException("Type is required");
            }

            if (!Enum.TryParse<ExerciseType>(type, out var exerciseType))
            {
                throw new ArgumentException("Type is invalid");
            }

            if (string.IsNullOrWhiteSpace(question))
            {
                throw new ArgumentException("Question is required");
            }

            if (string.IsNullOrWhiteSpace(data))
            {
                throw new ArgumentException("Data is required");
            }

            if (correctAnswer == null)
            {
                throw new ArgumentException("CorrectAnswer is required");
            }

            if (exerciseType == ExerciseType.MultipleChoice)
            {
                ValidateMultipleChoiceData(data, correctAnswer);
                return;
            }

            if (exerciseType == ExerciseType.Input)
            {
                ValidateInputData(data, correctAnswer);
                return;
            }

            if (exerciseType == ExerciseType.Match)
            {
                ValidateMatchData(data, correctAnswer);
                return;
            }
        }

        private static void ValidateMultipleChoiceData(string data, string correctAnswer)
        {
            var options = ParseStringArray(data);

            if (options.Count < 2)
            {
                throw new ArgumentException("MultipleChoice requires at least 2 options");
            }

            if (options.Count > 3)
            {
                throw new ArgumentException("MultipleChoice allows at most 3 options");
            }

            if (options.Any(x => string.IsNullOrWhiteSpace(x)))
            {
                throw new ArgumentException("MultipleChoice options are invalid");
            }

            if (string.IsNullOrWhiteSpace(correctAnswer))
            {
                throw new ArgumentException("CorrectAnswer is required");
            }

            bool contains = options.Any(x => string.Equals(x, correctAnswer, StringComparison.OrdinalIgnoreCase));

            if (!contains)
            {
                throw new ArgumentException("CorrectAnswer must be one of options");
            }
        }

        private static void ValidateInputData(string data, string correctAnswer)
        {
            var answers = ParseCorrectAnswers(correctAnswer);

            if (answers.Count == 0)
            {
                throw new ArgumentException("CorrectAnswer is required");
            }

            if (answers.Any(x => string.IsNullOrWhiteSpace(x)))
            {
                throw new ArgumentException("CorrectAnswer is invalid");
            }

            try
            {
                using var doc = JsonDocument.Parse(data);

                if (doc.RootElement.ValueKind != JsonValueKind.Object)
                {
                    throw new ArgumentException("Input Data must be a JSON object");
                }
            }
            catch (JsonException)
            {
                throw new ArgumentException("Data is invalid JSON");
            }
        }

        private static void ValidateMatchData(string data, string correctAnswer)
        {
            if (!string.IsNullOrWhiteSpace(correctAnswer) && correctAnswer.Trim() != "{}")
            {
                throw new ArgumentException("CorrectAnswer must be empty for Match");
            }

            try
            {
                using var doc = JsonDocument.Parse(data);

                if (doc.RootElement.ValueKind != JsonValueKind.Array)
                {
                    throw new ArgumentException("Match Data must be a JSON array");
                }

                int count = 0;

                foreach (var item in doc.RootElement.EnumerateArray())
                {
                    if (item.ValueKind != JsonValueKind.Object)
                    {
                        throw new ArgumentException("Match Data items must be objects");
                    }

                    if (!item.TryGetProperty("left", out var leftProp) || leftProp.ValueKind != JsonValueKind.String)
                    {
                        throw new ArgumentException("Match Data item.left is required");
                    }

                    if (!item.TryGetProperty("right", out var rightProp) || rightProp.ValueKind != JsonValueKind.String)
                    {
                        throw new ArgumentException("Match Data item.right is required");
                    }

                    var left = leftProp.GetString() ?? string.Empty;
                    var right = rightProp.GetString() ?? string.Empty;

                    if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right))
                    {
                        throw new ArgumentException("Match Data item.left/right must not be empty");
                    }

                    count++;
                }

                if (count < 2)
                {
                    throw new ArgumentException("Match requires at least 2 pairs");
                }

                if (count > 4)
                {
                    throw new ArgumentException("Match allows at most 4 pairs");
                }
            }
            catch (JsonException)
            {
                throw new ArgumentException("Data is invalid JSON");
            }
        }

        private static List<string> ParseStringArray(string json)
        {
            try
            {
                var list = JsonSerializer.Deserialize<List<string>>(json);

                if (list == null)
                {
                    return new List<string>();
                }

                return list;
            }
            catch
            {
                return new List<string>();
            }
        }

        private static List<string> ParseCorrectAnswers(string correctAnswer)
        {
            if (correctAnswer == null)
            {
                return new List<string>();
            }

            var trimmed = correctAnswer.Trim();

            if (trimmed.Length == 0)
            {
                return new List<string>();
            }

            if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
            {
                try
                {
                    var list = JsonSerializer.Deserialize<List<string>>(trimmed);
                    return list ?? new List<string>();
                }
                catch
                {
                    return new List<string>();
                }
            }

            return new List<string> { correctAnswer };
        }
    }
}
