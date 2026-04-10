using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;
using Lumino.Api.Utils;
using System.Text.Json;

namespace Lumino.Api.Application.Services
{
    public class AdminExerciseService : IAdminExerciseService
    {
        private readonly LuminoDbContext _dbContext;

        public AdminExerciseService(LuminoDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public List<AdminExerciseResponse> GetByLesson(int lessonId)
        {
            return _dbContext.Exercises
                .Where(x => x.LessonId == lessonId)
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
        }

        public AdminExerciseDetailsResponse GetById(int id)
        {
            var exercise = _dbContext.Exercises.FirstOrDefault(x => x.Id == id);

            if (exercise == null)
            {
                throw new KeyNotFoundException("Exercise not found");
            }

            var correctAnswers = ParseCorrectAnswers(exercise.CorrectAnswer);

            var preview = BuildPreview(exercise.Type, exercise.Data, correctAnswers);

            return new AdminExerciseDetailsResponse
            {
                Id = exercise.Id,
                LessonId = exercise.LessonId,
                Type = exercise.Type.ToString(),
                Question = exercise.Question,
                Data = exercise.Data,
                CorrectAnswer = exercise.CorrectAnswer,
                Order = exercise.Order,
                ImageUrl = NormalizeImageUrl(exercise.ImageUrl),
                CorrectAnswers = correctAnswers,
                Preview = preview
            };
        }

        public AdminExerciseResponse Copy(int id, CopyItemRequest? request)
        {
            var source = _dbContext.Exercises.FirstOrDefault(x => x.Id == id);

            if (source == null)
            {
                throw new KeyNotFoundException("Exercise not found");
            }

            int targetLessonId = request?.TargetLessonId ?? source.LessonId;

            var lessonExists = _dbContext.Lessons.Any(x => x.Id == targetLessonId);

            if (!lessonExists)
            {
                throw new KeyNotFoundException("Target lesson not found");
            }

            EnsureLessonHasExerciseSlot(targetLessonId);

            var newOrder = GetNextAvailableExerciseOrder(targetLessonId);

            var copy = new Exercise
            {
                LessonId = targetLessonId,
                Type = source.Type,
                Question = source.Question,
                Data = source.Data,
                CorrectAnswer = source.CorrectAnswer,
                Order = newOrder,
                ImageUrl = NormalizeImageUrl(source.ImageUrl)
            };

            _dbContext.Exercises.Add(copy);
            _dbContext.SaveChanges();

            var courseId = GetCourseIdByLessonId(copy.LessonId);
            CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, courseId);

            return new AdminExerciseResponse
            {
                Id = copy.Id,
                LessonId = copy.LessonId,
                Type = copy.Type.ToString(),
                Question = copy.Question,
                Data = copy.Data,
                CorrectAnswer = copy.CorrectAnswer,
                Order = copy.Order,
                ImageUrl = NormalizeImageUrl(copy.ImageUrl)
            };
        }

        public AdminExerciseResponse Create(CreateExerciseRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            EnsureLessonHasExerciseSlot(request.LessonId);

            int order = NormalizeOrder(request.Order);

            ValidateExerciseOrderRange(order);
            ValidateExercise(request.Type, request.Question, request.Data, request.CorrectAnswer);

            ValidateOrderUnique(request.LessonId, 0, order);

            var exercise = new Exercise
            {
                LessonId = request.LessonId,
                Type = Enum.Parse<ExerciseType>(request.Type),
                Question = request.Question,
                Data = request.Data,
                CorrectAnswer = request.CorrectAnswer,
                Order = order,
                ImageUrl = NormalizeImageUrl(request.ImageUrl)
            };

            _dbContext.Exercises.Add(exercise);
            _dbContext.SaveChanges();

            var courseId = GetCourseIdByLessonId(exercise.LessonId);
            CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, courseId);

            return new AdminExerciseResponse
            {
                Id = exercise.Id,
                LessonId = exercise.LessonId,
                Type = exercise.Type.ToString(),
                Question = exercise.Question,
                Data = exercise.Data,
                CorrectAnswer = exercise.CorrectAnswer,
                Order = exercise.Order,
                ImageUrl = NormalizeImageUrl(exercise.ImageUrl)
            };
        }

        public void Update(int id, UpdateExerciseRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var exercise = _dbContext.Exercises.FirstOrDefault(x => x.Id == id);

            if (exercise == null)
            {
                throw new KeyNotFoundException("Exercise not found");
            }

            int order = NormalizeOrder(request.Order);

            ValidateExerciseOrderRange(order);
            ValidateExercise(request.Type, request.Question, request.Data, request.CorrectAnswer);

            ValidateOrderUnique(exercise.LessonId, exercise.Id, order);

            exercise.Type = Enum.Parse<ExerciseType>(request.Type);
            exercise.Question = request.Question;
            exercise.Data = request.Data;
            exercise.CorrectAnswer = request.CorrectAnswer;
            exercise.Order = order;
            exercise.ImageUrl = NormalizeImageUrl(request.ImageUrl);

            _dbContext.SaveChanges();

            var courseId = GetCourseIdByLessonId(exercise.LessonId);
            CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, courseId);
        }

        public void Delete(int id)
        {
            var exercise = _dbContext.Exercises.FirstOrDefault(x => x.Id == id);

            if (exercise == null)
            {
                throw new KeyNotFoundException("Exercise not found");
            }

            var courseId = GetCourseIdByLessonId(exercise.LessonId);

            _dbContext.Exercises.Remove(exercise);
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

            return _dbContext.Topics
                .Where(x => x.Id == topicId.Value)
                .Select(x => (int?)x.CourseId)
                .FirstOrDefault();
        }

        private static string? NormalizeImageUrl(string? imageUrl)
        {
            return MediaUrlResolver.NormalizeLessonImageUrl(imageUrl);
        }

        private int NormalizeOrder(int order)
        {
            if (order < 0)
            {
                return 0;
            }

            return order;
        }

        private int GetNextAvailableExerciseOrder(int lessonId)
        {
            var usedOrders = _dbContext.Exercises
                .Where(x => x.LessonId == lessonId && x.Order > 0)
                .Select(x => x.Order)
                .Distinct()
                .ToHashSet();

            for (int order = 1; order <= CourseStructureLimits.ExercisesPerLesson; order++)
            {
                if (!usedOrders.Contains(order))
                {
                    return order;
                }
            }

            return 0;
        }

        private void EnsureLessonHasExerciseSlot(int lessonId)
        {
            var exercisesCount = _dbContext.Exercises.Count(x => x.LessonId == lessonId);

            if (exercisesCount >= CourseStructureLimits.ExercisesPerLesson)
            {
                throw new ArgumentException($"Lesson can contain at most {CourseStructureLimits.ExercisesPerLesson} exercises");
            }
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

        private void ValidateOrderUnique(int lessonId, int exerciseId, int order)
        {
            if (order <= 0)
            {
                return;
            }

            bool exists = _dbContext.Exercises.Any(x =>
                x.LessonId == lessonId &&
                x.Order == order &&
                x.Id != exerciseId);

            if (exists)
            {
                throw new ArgumentException("Exercise with this Order already exists in this lesson");
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

                var leftSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var rightSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

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

                    if (leftSet.Contains(left))
                    {
                        throw new ArgumentException("Match Data item.left must be unique");
                    }

                    if (rightSet.Contains(right))
                    {
                        throw new ArgumentException("Match Data item.right must be unique");
                    }

                    leftSet.Add(left);
                    rightSet.Add(right);

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

        private static AdminExercisePreviewResponse BuildPreview(ExerciseType type, string data, List<string> correctAnswers)
        {
            if (type == ExerciseType.MultipleChoice)
            {
                var options = ParseStringArray(data);

                return new AdminExercisePreviewResponse
                {
                    Summary = $"MultipleChoice ({options.Count} options)",
                    OptionsCount = options.Count,
                    PairsCount = 0
                };
            }

            if (type == ExerciseType.Match)
            {
                int pairs = 0;

                try
                {
                    using var doc = JsonDocument.Parse(data);

                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        pairs = doc.RootElement.GetArrayLength();
                    }
                }
                catch
                {
                    pairs = 0;
                }

                return new AdminExercisePreviewResponse
                {
                    Summary = $"Match ({pairs} pairs)",
                    OptionsCount = 0,
                    PairsCount = pairs
                };
            }

            var answersCount = correctAnswers.Count;

            return new AdminExercisePreviewResponse
            {
                Summary = answersCount <= 1
                    ? "Input (1 correct answer)"
                    : $"Input ({answersCount} correct answers)",
                OptionsCount = 0,
                PairsCount = 0
            };
        }
    }
}
