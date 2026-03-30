using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Application.Validators;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;
using Lumino.Api.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System;
using System.Text.Json;
using System.Collections.Generic;
using System.Linq;

namespace Lumino.Api.Application.Services
{
    public class LessonResultService : ILessonResultService
    {
        private readonly LuminoDbContext _dbContext;
        private readonly IAchievementService _achievementService;
        private readonly IDateTimeProvider _dateTimeProvider;
        private readonly IUserEconomyService _userEconomyService;
        private readonly IStreakService _streakService;
        private readonly ISubmitLessonRequestValidator _submitLessonRequestValidator;
        private readonly LearningSettings _learningSettings;

        public LessonResultService(
            LuminoDbContext dbContext,
            IAchievementService achievementService,
            IDateTimeProvider dateTimeProvider,
            IUserEconomyService userEconomyService,
            IStreakService streakService,
            ISubmitLessonRequestValidator submitLessonRequestValidator,
            IOptions<LearningSettings> learningSettings)
        {
            _dbContext = dbContext;
            _achievementService = achievementService;
            _dateTimeProvider = dateTimeProvider;
            _userEconomyService = userEconomyService;
            _streakService = streakService;
            _submitLessonRequestValidator = submitLessonRequestValidator;
            _learningSettings = learningSettings.Value;
        }

        public SubmitLessonResponse SubmitLesson(int userId, SubmitLessonRequest request)
        {
            _submitLessonRequestValidator.Validate(request);

            var lesson = _dbContext.Lessons.FirstOrDefault(x => x.Id == request.LessonId);

            if (lesson == null)
            {
                throw new KeyNotFoundException("Lesson not found");
            }

            var progress = _dbContext.UserLessonProgresses
                .FirstOrDefault(x => x.UserId == userId && x.LessonId == lesson.Id);

            if (progress == null || !progress.IsUnlocked)
            {
                throw new ForbiddenAccessException("Lesson is locked");
            }

            var previousBestScore = progress.BestScore;

            var idempotencyKey = NormalizeIdempotencyKey(request.IdempotencyKey);

            if (idempotencyKey != null)
            {
                var existingResult = _dbContext.LessonResults
                    .FirstOrDefault(x => x.UserId == userId && x.LessonId == lesson.Id && x.IdempotencyKey == idempotencyKey);

                if (existingResult != null)
                {
                    return BuildResponseFromExistingResult(existingResult);
                }
            }

            var exercises = _dbContext.Exercises
                .Where(x => x.LessonId == lesson.Id)
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            int correct = 0;
            var mistakeExerciseIds = new List<int>();
            var answers = new List<LessonAnswerResultDto>();

            foreach (var exercise in exercises)
            {
                var userAnswer = request.Answers
                    .FirstOrDefault(x => x.ExerciseId == exercise.Id);

                var userAnswerText = userAnswer != null
                    ? (userAnswer.Answer ?? string.Empty)
                    : string.Empty;

                var isCorrect = IsExerciseCorrect(exercise, userAnswerText);

                var correctAnswerForResponse = exercise.Type == ExerciseType.Match
                    ? (exercise.Data ?? string.Empty)
                    : (exercise.CorrectAnswer ?? string.Empty);

                answers.Add(new LessonAnswerResultDto
                {
                    ExerciseId = exercise.Id,
                    UserAnswer = userAnswerText,
                    CorrectAnswer = correctAnswerForResponse,
                    IsCorrect = isCorrect
                });

                if (isCorrect)
                {
                    correct++;
                    continue;
                }

                mistakeExerciseIds.Add(exercise.Id);
            }

            var passingScorePercent = LessonPassingRules.NormalizePassingPercent(_learningSettings.PassingScorePercent);
            var isPassed = LessonPassingRules.IsPassed(correct, exercises.Count, passingScorePercent);

            // CompletedLessons збільшуємо лише при першому PASSED цього уроку
            var shouldIncrementCompletedLessons = isPassed &&
                !_dbContext.LessonResults.Any(x =>
                    x.UserId == userId &&
                    x.LessonId == lesson.Id &&
                    x.TotalQuestions > 0 &&
                    x.Score * 100 >= x.TotalQuestions * passingScorePercent
                );

            // зберігаємо деталізацію в MistakesJson (backward-compatible)
            var detailsJson = new LessonResultDetailsJson
            {
                MistakeExerciseIds = mistakeExerciseIds,
                Answers = answers
            };

            var result = new LessonResult
            {
                UserId = userId,
                LessonId = lesson.Id,
                Score = correct,
                TotalQuestions = exercises.Count,
                IdempotencyKey = idempotencyKey,
                MistakesJson = JsonSerializer.Serialize(detailsJson),
                CompletedAt = _dateTimeProvider.UtcNow
            };

            _dbContext.LessonResults.Add(result);

            try
            {
                _dbContext.SaveChanges();
            }
            catch (DbUpdateException)
            {
                // якщо паралельно прилетів такий самий submit з тим самим ключем
                if (idempotencyKey != null)
                {
                    var existingResult = _dbContext.LessonResults
                        .FirstOrDefault(x => x.UserId == userId && x.LessonId == lesson.Id && x.IdempotencyKey == idempotencyKey);

                    if (existingResult != null)
                    {
                        return BuildResponseFromExistingResult(existingResult);
                    }
                }

                throw;
            }


            _userEconomyService.ConsumeHeartsForMistakes(userId, mistakeExerciseIds.Count);

            UpdateUserProgress(userId, shouldIncrementCompletedLessons);

            // автододавання слів у Vocabulary після Passed
            AddLessonVocabularyIfNeeded(userId, lesson, exercises, answers, mistakeExerciseIds, isPassed);

            // активний курс + прогрес уроків + unlock наступного + перенос LastLessonId
            UpdateCourseProgressAfterLesson(userId, lesson.Id, isPassed, correct);

            _streakService.RegisterLessonActivity(userId);

            var earnedPoints = CalculateEarnedPoints(previousBestScore, correct);
            var earnedCrystals = CalculateEarnedCrystals(previousBestScore, correct);

            if (earnedCrystals > 0)
            {
                _userEconomyService.AwardCrystals(userId, earnedCrystals);
            }

            _achievementService.CheckAndGrantAchievements(userId, correct, exercises.Count);

            return new SubmitLessonResponse
            {
                TotalExercises = exercises.Count,
                CorrectAnswers = correct,
                IsPassed = isPassed,
                EarnedPoints = earnedPoints,
                EarnedCrystals = earnedCrystals,
                MistakeExerciseIds = mistakeExerciseIds,
                Answers = answers
            };
        }

        private SubmitLessonResponse BuildResponseFromExistingResult(LessonResult result)
        {
            var passingScorePercent = LessonPassingRules.NormalizePassingPercent(_learningSettings.PassingScorePercent);
            var isPassed = LessonPassingRules.IsPassed(result.Score, result.TotalQuestions, passingScorePercent);

            var earnedPoints = GetEarnedPointsForLessonResult(result, passingScorePercent);
            var earnedCrystals = GetEarnedCrystalsForLessonResult(result, passingScorePercent);

            var mistakeExerciseIds = new List<int>();
            var answers = new List<LessonAnswerResultDto>();

            if (!string.IsNullOrWhiteSpace(result.MistakesJson))
            {
                try
                {
                    var details = JsonSerializer.Deserialize<LessonResultDetailsJson>(result.MistakesJson);

                    if (details != null)
                    {
                        mistakeExerciseIds = details.MistakeExerciseIds ?? new List<int>();
                        answers = details.Answers ?? new List<LessonAnswerResultDto>();
                    }
                }
                catch
                {
                    // ignore broken json - keep empty arrays (backward-compatible)
                }
            }

            return new SubmitLessonResponse
            {
                TotalExercises = result.TotalQuestions,
                CorrectAnswers = result.Score,
                IsPassed = isPassed,
                EarnedPoints = earnedPoints,
                EarnedCrystals = earnedCrystals,
                MistakeExerciseIds = mistakeExerciseIds,
                Answers = answers
            };
        }

        private int GetEarnedPointsForLessonResult(LessonResult result, int passingScorePercent)
        {
            if (result.TotalQuestions <= 0)
            {
                return 0;
            }

            var previousBestScore = _dbContext.LessonResults
                .Where(x =>
                    x.UserId == result.UserId &&
                    x.LessonId == result.LessonId &&
                    (
                        x.CompletedAt < result.CompletedAt ||
                        (x.CompletedAt == result.CompletedAt && x.Id < result.Id)
                    ))
                .Select(x => (int?)x.Score)
                .Max() ?? 0;

            return CalculateEarnedPoints(previousBestScore, result.Score);
        }

        private int GetEarnedCrystalsForLessonResult(LessonResult result, int passingScorePercent)
        {
            if (result.TotalQuestions <= 0)
            {
                return 0;
            }

            var previousBestScore = _dbContext.LessonResults
                .Where(x =>
                    x.UserId == result.UserId &&
                    x.LessonId == result.LessonId &&
                    (
                        x.CompletedAt < result.CompletedAt ||
                        (x.CompletedAt == result.CompletedAt && x.Id < result.Id)
                    ))
                .Select(x => (int?)x.Score)
                .Max() ?? 0;

            return CalculateEarnedCrystals(previousBestScore, result.Score);
        }

        private int CalculateEarnedPoints(int previousBestScore, int currentScore)
        {
            var improvement = currentScore - previousBestScore;

            if (improvement <= 0)
            {
                return 0;
            }

            return GetLessonPoints(improvement);
        }

        private int CalculateEarnedCrystals(int previousBestScore, int currentScore)
        {
            return CalculateEarnedPoints(previousBestScore, currentScore);
        }

        private string? NormalizeIdempotencyKey(string? key)
        {
            if (key == null)
            {
                return null;
            }

            var normalized = key.Trim();

            return normalized.Length == 0 ? null : normalized;
        }

        private bool IsExerciseCorrect(Exercise exercise, string userAnswerText)
        {
            if (exercise == null)
            {
                return false;
            }

            userAnswerText = userAnswerText ?? string.Empty;

            if (exercise.Type == ExerciseType.Match)
            {
                return IsMatchCorrect(exercise.Data, userAnswerText);
            }

            var correctAnswerRaw = (exercise.CorrectAnswer ?? string.Empty);

            if (exercise.Type == ExerciseType.Input)
            {
                var answers = GetAcceptedInputAnswers(exercise, correctAnswerRaw);

                if (answers.Count == 0)
                {
                    return false;
                }

                if (string.IsNullOrWhiteSpace(userAnswerText))
                {
                    return false;
                }

                var normalizedUser = Normalize(userAnswerText);

                return answers.Any(x => Normalize(x) == normalizedUser);
            }

            return !string.IsNullOrWhiteSpace(userAnswerText) &&
                Normalize(userAnswerText) == Normalize(correctAnswerRaw);
        }

        private List<string> GetAcceptedInputAnswers(Exercise exercise, string correctAnswerRaw)
        {
            var answers = ParseCorrectAnswers(correctAnswerRaw);

            if (exercise == null || answers.Count == 0)
            {
                return answers;
            }

            var vocabularyItemIds = _dbContext.ExerciseVocabularies
                .Where(x => x.ExerciseId == exercise.Id)
                .Select(x => x.VocabularyItemId)
                .Distinct()
                .ToList();

            if (vocabularyItemIds.Count == 0)
            {
                return answers;
            }

            var normalizedAnswers = answers
                .Select(Normalize)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            if (normalizedAnswers.Count == 0)
            {
                return answers;
            }

            var vocabularyItems = _dbContext.VocabularyItems
                .Where(x => vocabularyItemIds.Contains(x.Id))
                .Select(x => new
                {
                    x.Id,
                    x.Translation
                })
                .ToList();

            var translationsByItemId = _dbContext.VocabularyItemTranslations
                .Where(x => vocabularyItemIds.Contains(x.VocabularyItemId))
                .OrderBy(x => x.Order)
                .ToList()
                .GroupBy(x => x.VocabularyItemId)
                .ToDictionary(
                    x => x.Key,
                    x => x.Select(t => t.Translation).ToList());

            foreach (var item in vocabularyItems)
            {
                var itemTranslations = translationsByItemId.TryGetValue(item.Id, out var list)
                    ? list
                    : new List<string>();

                if (itemTranslations.Count == 0 && !string.IsNullOrWhiteSpace(item.Translation))
                {
                    itemTranslations.Add(item.Translation);
                }

                var normalizedTranslations = itemTranslations
                    .Select(Normalize)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .ToList();

                var expectsTranslation = normalizedTranslations.Any(normalizedAnswers.Contains);

                if (!expectsTranslation)
                {
                    continue;
                }

                foreach (var translation in itemTranslations)
                {
                    var normalizedTranslation = Normalize(translation);

                    if (string.IsNullOrWhiteSpace(normalizedTranslation) || normalizedAnswers.Contains(normalizedTranslation))
                    {
                        continue;
                    }

                    answers.Add(translation);
                    normalizedAnswers.Add(normalizedTranslation);
                }
            }

            return answers;
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
                    return NormalizeAnswerList(list);
                }
                catch
                {
                    return new List<string>();
                }
            }

            return NormalizeAnswerList(SplitAnswerVariants(trimmed));
        }

        private static List<string> SplitAnswerVariants(string value)
        {
            value = (value ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(value))
            {
                return new List<string>();
            }

            value = value
                .Replace(" або ", "|", StringComparison.OrdinalIgnoreCase)
                .Replace(" or ", "|", StringComparison.OrdinalIgnoreCase);

            return value
                .Split(new[] { '/', ',', ';', '|', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(x => (x ?? string.Empty).Trim())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToList();
        }

        private static List<string> NormalizeAnswerList(List<string>? answers)
        {
            if (answers == null)
            {
                return new List<string>();
            }

            var result = new List<string>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var answer in answers)
            {
                var trimmed = (answer ?? string.Empty).Trim();

                if (trimmed.Length == 0)
                {
                    continue;
                }

                var normalized = Normalize(trimmed);

                if (!seen.Add(normalized))
                {
                    continue;
                }

                result.Add(trimmed);
            }

            return result;
        }

        private bool IsMatchCorrect(string dataJson, string userJson)
        {
            if (string.IsNullOrWhiteSpace(dataJson) || string.IsNullOrWhiteSpace(userJson))
            {
                return false;
            }

            List<MatchPair> correctPairs;
            List<MatchPair>? userPairs;

            try
            {
                correctPairs = JsonSerializer.Deserialize<List<MatchPair>>(dataJson) ?? new List<MatchPair>();
                userPairs = ParseMatchPairs(correctPairs, userJson);
            }
            catch
            {
                return false;
            }

            if (userPairs == null)
            {
                return false;
            }

            return IsGroupedMatchCorrect(correctPairs, userPairs);
        }

        private bool IsIndexedMatchCorrect(List<MatchPair> correctPairs, List<MatchPair> userPairs)
        {
            return IsGroupedMatchCorrect(correctPairs, userPairs);
        }

        private static bool HasIndexedMatchPairs(List<MatchPair> pairs)
        {
            return pairs.Any(x => x.LeftIndex.HasValue || x.RightIndex.HasValue);
        }

        private bool IsGroupedMatchCorrect(List<MatchPair> correctPairs, List<MatchPair> userPairs)
        {
            var correctEntries = correctPairs
                .Select(x => new
                {
                    Left = Normalize(x.left),
                    Right = Normalize(x.right)
                })
                .Where(x => string.IsNullOrWhiteSpace(x.Left) == false && string.IsNullOrWhiteSpace(x.Right) == false)
                .ToList();

            var userEntries = userPairs
                .Select(x => new
                {
                    Left = Normalize(x.left),
                    Right = Normalize(x.right)
                })
                .Where(x => string.IsNullOrWhiteSpace(x.Left) == false && string.IsNullOrWhiteSpace(x.Right) == false)
                .ToList();

            if (correctEntries.Count == 0 || userEntries.Count == 0)
            {
                return false;
            }

            if (correctEntries.Count != correctPairs.Count || userEntries.Count != userPairs.Count)
            {
                return false;
            }

            if (correctEntries.Count != userEntries.Count)
            {
                return false;
            }

            var correctCountsByLeft = correctEntries
                .GroupBy(x => x.Left)
                .ToDictionary(
                    x => x.Key,
                    x => x.GroupBy(y => y.Right).ToDictionary(y => y.Key, y => y.Count()));

            var userCountsByLeft = userEntries
                .GroupBy(x => x.Left)
                .ToDictionary(
                    x => x.Key,
                    x => x.GroupBy(y => y.Right).ToDictionary(y => y.Key, y => y.Count()));

            if (correctCountsByLeft.Count != userCountsByLeft.Count)
            {
                return false;
            }

            foreach (var leftGroup in correctCountsByLeft)
            {
                if (userCountsByLeft.TryGetValue(leftGroup.Key, out var userRightCounts) == false)
                {
                    return false;
                }

                if (leftGroup.Value.Count != userRightCounts.Count)
                {
                    return false;
                }

                foreach (var rightGroup in leftGroup.Value)
                {
                    if (userRightCounts.TryGetValue(rightGroup.Key, out var userCount) == false)
                    {
                        return false;
                    }

                    if (userCount != rightGroup.Value)
                    {
                        return false;
                    }
                }
            }

            return true;
        }

        private class MatchPair
        {
            public int? LeftIndex { get; set; }
            public int? RightIndex { get; set; }
            public string left { get; set; } = null!;
            public string right { get; set; } = null!;
        }

        private List<MatchPair>? ParseMatchPairs(List<MatchPair> correctPairs, string userJson)
        {
            if (string.IsNullOrWhiteSpace(userJson))
            {
                return null;
            }

            var trimmed = userJson.Trim();

            if (trimmed.StartsWith("{"))
            {
                var map = JsonSerializer.Deserialize<Dictionary<string, string>>(trimmed);

                if (map == null)
                {
                    return null;
                }

                return map.Select(x => new MatchPair { left = x.Key, right = x.Value }).ToList();
            }

            using var document = JsonDocument.Parse(trimmed);

            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            var result = new List<MatchPair>();

            foreach (var item in document.RootElement.EnumerateArray())
            {
                if (item.ValueKind != JsonValueKind.Object)
                {
                    return null;
                }

                var leftIndex = GetMatchIndex(item, "leftIndex");
                var rightIndex = GetMatchIndex(item, "rightIndex");
                var left = ReadMatchText(item, "left");
                var right = ReadMatchText(item, "right");

                if (leftIndex.HasValue && leftIndex.Value >= 0 && leftIndex.Value < correctPairs.Count)
                {
                    left = correctPairs[leftIndex.Value].left;
                }

                if (rightIndex.HasValue && rightIndex.Value >= 0 && rightIndex.Value < correctPairs.Count)
                {
                    right = correctPairs[rightIndex.Value].right;
                }

                result.Add(new MatchPair
                {
                    LeftIndex = leftIndex,
                    RightIndex = rightIndex,
                    left = left,
                    right = right
                });
            }

            return result;
        }

        private static int? GetMatchIndex(JsonElement item, string propertyName)
        {
            if (item.TryGetProperty(propertyName, out var property) == false)
            {
                return null;
            }

            if (property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out var index))
            {
                return index;
            }

            if (property.ValueKind == JsonValueKind.String && int.TryParse(property.GetString(), out index))
            {
                return index;
            }

            return null;
        }

        private static string ReadMatchText(JsonElement item, string propertyName)
        {
            if (item.TryGetProperty(propertyName, out var property) == false)
            {
                return string.Empty;
            }

            if (property.ValueKind == JsonValueKind.String)
            {
                return property.GetString() ?? string.Empty;
            }

            if (property.ValueKind == JsonValueKind.Null || property.ValueKind == JsonValueKind.Undefined)
            {
                return string.Empty;
            }

            return property.ToString();
        }

        private static string Normalize(string value)
        {
            return AnswerNormalizer.Normalize(value);
        }

        private void UpdateUserProgress(int userId, bool shouldIncrementCompletedLessons)
        {
            var progress = _dbContext.UserProgresses
                .FirstOrDefault(x => x.UserId == userId);

            if (progress == null)
            {
                progress = new UserProgress
                {
                    UserId = userId,
                    CompletedLessons = shouldIncrementCompletedLessons ? 1 : 0,
                    TotalScore = CalculateBestTotalScore(userId),
                    LastUpdatedAt = _dateTimeProvider.UtcNow
                };

                _dbContext.UserProgresses.Add(progress);
            }
            else
            {
                if (shouldIncrementCompletedLessons)
                {
                    progress.CompletedLessons++;
                }

                // TotalScore = сума найкращих результатів по кожному уроку
                progress.TotalScore = CalculateBestTotalScore(userId);
                progress.LastUpdatedAt = _dateTimeProvider.UtcNow;
            }

            _dbContext.SaveChanges();
        }

        private int CalculateBestTotalScore(int userId)
        {
            var results = _dbContext.LessonResults
                .Where(x => x.UserId == userId)
                .ToList();

            var bestByLesson = new Dictionary<int, int>();

            foreach (var r in results)
            {
                if (!bestByLesson.ContainsKey(r.LessonId))
                {
                    bestByLesson[r.LessonId] = r.Score;
                    continue;
                }

                if (r.Score > bestByLesson[r.LessonId])
                {
                    bestByLesson[r.LessonId] = r.Score;
                }
            }

            var lessonsScore = bestByLesson.Values.Sum(GetLessonPoints);

            int completedScenesCount = _dbContext.SceneAttempts
                .Where(x => x.UserId == userId && x.IsCompleted)
                .Select(x => x.SceneId)
                .Distinct()
                .Count();

            int scenesScore = completedScenesCount * _learningSettings.SceneCompletionScore;

            return lessonsScore + scenesScore;
        }

        private void AddLessonVocabularyIfNeeded(
            int userId,
            Lesson lesson,
            List<Exercise> exercises,
            List<LessonAnswerResultDto> answers,
            List<int> mistakeExerciseIds,
            bool isPassed)
        {
            if (!isPassed)
            {
                return;
            }

            var now = _dateTimeProvider.UtcNow;

            var lessonVocabItemIds = _dbContext.LessonVocabularies
                .Where(x => x.LessonId == lesson.Id)
                .Select(x => x.VocabularyItemId)
                .Distinct()
                .ToList();

            var theoryPairs = lessonVocabItemIds.Count > 0
                ? _dbContext.VocabularyItems
                    .Where(x => lessonVocabItemIds.Contains(x.Id))
                    .ToList()
                    .Select(x => (x.Word, x.Translation))
                    .ToList()
                : ExtractPairsFromTheory(lesson.Theory);

            var mistakeExerciseVocabItemIds = _dbContext.ExerciseVocabularies
                .Where(x => mistakeExerciseIds.Contains(x.ExerciseId))
                .Select(x => x.VocabularyItemId)
                .Distinct()
                .ToList();

            var mistakePairs = mistakeExerciseVocabItemIds.Count > 0
                ? _dbContext.VocabularyItems
                    .Where(x => mistakeExerciseVocabItemIds.Contains(x.Id))
                    .ToList()
                    .Select(x => (x.Word, x.Translation))
                    .ToList()
                : ExtractPairsFromMistakes(exercises, answers, mistakeExerciseIds);

            var allPairs = theoryPairs
                .Concat(mistakePairs)
                .Distinct()
                .ToList();

            if (allPairs.Count == 0)
            {
                return;
            }

            var mistakeSet = new HashSet<(string Word, string Translation)>(mistakePairs);

            foreach (var pair in allPairs)
            {
                var word = Normalize(pair.Word);
                var translation = Normalize(pair.Translation);

                if (string.IsNullOrWhiteSpace(word) || string.IsNullOrWhiteSpace(translation))
                {
                    continue;
                }

                if (AutoVocabularyFilter.ShouldAutoAdd(word) == false)
                {
                    continue;
                }

                var templateItem = _dbContext.VocabularyItems
                    .FirstOrDefault(x => x.Word == word && x.Translation == translation);

                var isMistake = mistakeSet.Contains(pair);

                UserVocabularyIsolationHelper.EnsureUserWord(
                    _dbContext,
                    userId,
                    word,
                    translation,
                    templateItem,
                    now,
                    isMistake,
                    isMistake ? now : now.AddDays(1));
            }

            _dbContext.SaveChanges();
        }

        // курс визначаємо через Lesson -> Topic -> Course
        private void UpdateCourseProgressAfterLesson(int userId, int lessonId, bool isPassed, int score)
        {
            var now = _dateTimeProvider.UtcNow;

            UpsertLessonProgress(userId, lessonId, isPassed, score, now);

            var topicId = _dbContext.Lessons
                .Where(x => x.Id == lessonId)
                .Select(x => (int?)x.TopicId)
                .FirstOrDefault();

            if (topicId == null)
            {
                _dbContext.SaveChanges();
                return;
            }

            var courseId = _dbContext.Topics
                .Where(x => x.Id == topicId.Value)
                .Select(x => (int?)x.CourseId)
                .FirstOrDefault();

            if (courseId == null)
            {
                _dbContext.SaveChanges();
                return;
            }

            var userCourse = EnsureActiveCourse(userId, courseId.Value, lessonId, now);

            int? nextLessonId = null;

            if (isPassed)
            {
                nextLessonId = UnlockNextLesson(userId, courseId.Value, lessonId, now);

                // після Passed переносимо "де продовжувати" на наступний урок
                if (userCourse != null && nextLessonId != null)
                {
                    userCourse.LastLessonId = nextLessonId.Value;
                    userCourse.LastOpenedAt = now;
                }

                TryMarkCourseCompleted(userId, userCourse, courseId.Value, now);
            }

            _dbContext.SaveChanges();
        }

        private UserCourse? EnsureActiveCourse(int userId, int courseId, int lastLessonId, DateTime now)
        {
            var activeOther = _dbContext.UserCourses
                .Where(x => x.UserId == userId && x.IsActive && x.CourseId != courseId)
                .ToList();

            foreach (var item in activeOther)
            {
                item.IsActive = false;
                item.LastOpenedAt = now;
            }

            var userCourse = _dbContext.UserCourses
                .FirstOrDefault(x => x.UserId == userId && x.CourseId == courseId);

            if (userCourse == null)
            {
                userCourse = new UserCourse
                {
                    UserId = userId,
                    CourseId = courseId,
                    IsActive = true,
                    LastLessonId = lastLessonId,
                    StartedAt = now,
                    LastOpenedAt = now
                };

                _dbContext.UserCourses.Add(userCourse);
                return userCourse;
            }

            userCourse.IsActive = true;
            userCourse.LastLessonId = lastLessonId;
            userCourse.LastOpenedAt = now;

            if (userCourse.StartedAt == default)
            {
                userCourse.StartedAt = now;
            }

            return userCourse;
        }

        private void UpsertLessonProgress(int userId, int lessonId, bool isPassed, int score, DateTime now)
        {
            var progress = _dbContext.UserLessonProgresses
                .FirstOrDefault(x => x.UserId == userId && x.LessonId == lessonId);

            if (progress == null)
            {
                progress = new UserLessonProgress
                {
                    UserId = userId,
                    LessonId = lessonId,
                    IsUnlocked = true,
                    IsCompleted = isPassed,
                    BestScore = score,
                    LastAttemptAt = now
                };

                _dbContext.UserLessonProgresses.Add(progress);
                return;
            }

            if (!progress.IsUnlocked)
            {
                progress.IsUnlocked = true;
            }

            if (score > progress.BestScore)
            {
                progress.BestScore = score;
            }

            if (isPassed)
            {
                progress.IsCompleted = true;
            }

            progress.LastAttemptAt = now;
        }

        private int? UnlockNextLesson(int userId, int courseId, int currentLessonId, DateTime now)
        {
            var orderedTopics = _dbContext.Topics
                .Where(x => x.CourseId == courseId)
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .Select(x => x.Id)
                .ToList();

            var orderedLessons =
                (from t in _dbContext.Topics
                 join l in _dbContext.Lessons on t.Id equals l.TopicId
                 where t.CourseId == courseId
                 orderby (t.Order <= 0 ? int.MaxValue : t.Order), t.Id, (l.Order <= 0 ? int.MaxValue : l.Order), l.Id
                 select new
                 {
                     LessonId = l.Id,
                     TopicId = t.Id
                 })
                .ToList();

            if (orderedLessons.Count == 0)
            {
                return null;
            }

            int index = orderedLessons.FindIndex(x => x.LessonId == currentLessonId);

            if (index < 0 || index + 1 >= orderedLessons.Count)
            {
                return null;
            }

            var current = orderedLessons[index];
            var nextInfo = orderedLessons[index + 1];

            if (nextInfo.TopicId != current.TopicId)
            {
                var orderedScenes = _dbContext.Scenes
                    .Where(x => x.CourseId == courseId || x.CourseId == null)
                    .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                    .ThenBy(x => x.Id)
                    .ToList();

                bool hasCurrentTopicScene = HasSceneGatewayForTopic(orderedScenes, orderedTopics, current.TopicId);

                if (hasCurrentTopicScene)
                {
                    bool isCurrentTopicSceneCompleted = _dbContext.SceneAttempts
                        .Where(x => x.UserId == userId && x.IsCompleted)
                        .Select(x => x.SceneId)
                        .ToList()
                        .Any(sceneId => IsSceneMappedToTopic(orderedScenes, orderedTopics, sceneId, current.TopicId));

                    if (!isCurrentTopicSceneCompleted)
                    {
                        return null;
                    }
                }
            }

            int nextLessonId = nextInfo.LessonId;

            var next = _dbContext.UserLessonProgresses
                .FirstOrDefault(x => x.UserId == userId && x.LessonId == nextLessonId);

            if (next == null)
            {
                next = new UserLessonProgress
                {
                    UserId = userId,
                    LessonId = nextLessonId,
                    IsUnlocked = true,
                    IsCompleted = false,
                    BestScore = 0,
                    LastAttemptAt = now
                };

                _dbContext.UserLessonProgresses.Add(next);
                return nextLessonId;
            }

            if (!next.IsUnlocked)
            {
                next.IsUnlocked = true;

                if (next.LastAttemptAt == null)
                {
                    next.LastAttemptAt = now;
                }
            }

            return nextLessonId;
        }


        private static bool HasSceneGatewayForTopic(List<Scene> scenes, List<int> orderedTopicIds, int topicId)
        {
            if (scenes == null || scenes.Count == 0 || orderedTopicIds == null || orderedTopicIds.Count == 0)
            {
                return false;
            }

            var courseScenes = scenes.Where(x => x.CourseId != null).ToList();
            var sourceScenes = courseScenes.Count > 0 ? courseScenes : scenes.Where(x => x.CourseId == null).ToList();

            for (int i = 0; i < sourceScenes.Count; i++)
            {
                if (sourceScenes[i].TopicId == topicId)
                {
                    return true;
                }

                if (!sourceScenes[i].TopicId.HasValue && i < orderedTopicIds.Count && orderedTopicIds[i] == topicId)
                {
                    return true;
                }
            }

            return false;
        }

        private static bool IsSceneMappedToTopic(List<Scene> scenes, List<int> orderedTopicIds, int sceneId, int topicId)
        {
            if (scenes == null || scenes.Count == 0 || orderedTopicIds == null || orderedTopicIds.Count == 0)
            {
                return false;
            }

            var courseScenes = scenes.Where(x => x.CourseId != null).ToList();
            var sourceScenes = courseScenes.Count > 0 ? courseScenes : scenes.Where(x => x.CourseId == null).ToList();

            var orderedSourceScenes = sourceScenes
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            for (int i = 0; i < orderedSourceScenes.Count; i++)
            {
                var scene = orderedSourceScenes[i];

                if (scene.Id != sceneId)
                {
                    continue;
                }

                if (scene.TopicId.HasValue)
                {
                    return scene.TopicId.Value == topicId;
                }

                return i < orderedTopicIds.Count && orderedTopicIds[i] == topicId;
            }

            return false;
        }

        private void TryMarkCourseCompleted(int userId, UserCourse? userCourse, int courseId, DateTime now)
        {
            if (userCourse == null)
            {
                return;
            }

            if (userCourse.IsCompleted)
            {
                return;
            }

            var lessonIds =
                (from t in _dbContext.Topics
                 join l in _dbContext.Lessons on t.Id equals l.TopicId
                 where t.CourseId == courseId
                 select l.Id)
                .Distinct()
                .ToList();

            if (lessonIds.Count == 0)
            {
                return;
            }

            // Враховуємо завершені уроки з БД
            var completedLessonIds = _dbContext.UserLessonProgresses
                .Where(x => x.UserId == userId && x.IsCompleted)
                .Where(x => lessonIds.Contains(x.LessonId))
                .Select(x => x.LessonId)
                .Distinct()
                .ToList();

            var completedSet = new HashSet<int>(completedLessonIds);

            // Враховуємо зміни в поточному DbContext (до SaveChanges),
            // щоб поточний PASSED урок також врахувався при завершенні курсу
            foreach (var progress in _dbContext.UserLessonProgresses.Local)
            {
                if (progress.UserId != userId)
                {
                    continue;
                }

                if (!lessonIds.Contains(progress.LessonId))
                {
                    continue;
                }

                if (progress.IsCompleted)
                {
                    completedSet.Add(progress.LessonId);
                }
                else
                {
                    completedSet.Remove(progress.LessonId);
                }
            }

            if (completedSet.Count < lessonIds.Count)
            {
                return;
            }

            var courseSceneIds = _dbContext.Scenes
                .Where(x => x.CourseId == courseId)
                .Select(x => x.Id)
                .Distinct()
                .ToList();

            if (courseSceneIds.Count > 0)
            {
                var completedSceneIds = _dbContext.SceneAttempts
                    .Where(x => x.UserId == userId && x.IsCompleted && courseSceneIds.Contains(x.SceneId))
                    .Select(x => x.SceneId)
                    .Distinct()
                    .ToHashSet();

                foreach (var attempt in _dbContext.SceneAttempts.Local)
                {
                    if (attempt.UserId != userId)
                    {
                        continue;
                    }

                    if (!courseSceneIds.Contains(attempt.SceneId))
                    {
                        continue;
                    }

                    if (attempt.IsCompleted)
                    {
                        completedSceneIds.Add(attempt.SceneId);
                    }
                    else
                    {
                        completedSceneIds.Remove(attempt.SceneId);
                    }
                }

                if (completedSceneIds.Count < courseSceneIds.Count)
                {
                    return;
                }
            }

            userCourse.IsCompleted = true;

            if (userCourse.CompletedAt == null)
            {
                userCourse.CompletedAt = now;
            }
        }


        private static List<(string Word, string Translation)> ExtractPairsFromTheory(string? theory)
        {
            var result = new List<(string Word, string Translation)>();

            if (string.IsNullOrWhiteSpace(theory))
            {
                return result;
            }

            var lines = theory.Split('\n', StringSplitOptions.RemoveEmptyEntries);

            foreach (var rawLine in lines)
            {
                var line = rawLine.Trim();

                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                var idx = line.IndexOf('=');

                if (idx <= 0)
                {
                    continue;
                }

                var left = line.Substring(0, idx).Trim();
                var right = line.Substring(idx + 1).Trim();

                if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right))
                {
                    continue;
                }

                result.Add((left, right));
            }

            return result;
        }

        private static List<(string Word, string Translation)> ExtractPairsFromMistakes(
            List<Exercise> exercises,
            List<LessonAnswerResultDto> answers,
            List<int> mistakeExerciseIds)
        {
            var result = new List<(string Word, string Translation)>();

            if (mistakeExerciseIds == null || mistakeExerciseIds.Count == 0)
            {
                return result;
            }

            foreach (var exId in mistakeExerciseIds)
            {
                var exercise = exercises.FirstOrDefault(x => x.Id == exId);

                if (exercise == null)
                {
                    continue;
                }

                if (TryExtractPairFromExercise(exercise, out var pair))
                {
                    result.Add(pair);
                }
            }

            return result;
        }

        private static bool TryExtractPairFromExercise(Exercise exercise, out (string Word, string Translation) pair)
        {
            pair = (string.Empty, string.Empty);

            var q = (exercise.Question ?? string.Empty).Trim();
            var correctRaw = (exercise.CorrectAnswer ?? string.Empty);
            var correct = (ParseCorrectAnswers(correctRaw).FirstOrDefault() ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(q) || string.IsNullOrWhiteSpace(correct))
            {
                return false;
            }

            // Pattern: "Hello = ?"
            if (q.Contains("= ?"))
            {
                var idx = q.IndexOf('=');

                if (idx > 0)
                {
                    var left = q.Substring(0, idx).Trim();

                    if (!string.IsNullOrWhiteSpace(left))
                    {
                        pair = (left, correct);
                        return true;
                    }
                }
            }

            // Pattern: "Write Ukrainian for: Goodbye"
            if (q.StartsWith("Write Ukrainian for:", StringComparison.OrdinalIgnoreCase))
            {
                var idx = q.IndexOf(':');

                if (idx >= 0 && idx + 1 < q.Length)
                {
                    var word = q.Substring(idx + 1).Trim();

                    if (!string.IsNullOrWhiteSpace(word))
                    {
                        pair = (word, correct);
                        return true;
                    }
                }
            }

            // Pattern: "Write English: У мене все добре"
            if (q.StartsWith("Write English:", StringComparison.OrdinalIgnoreCase))
            {
                var idx = q.IndexOf(':');

                if (idx >= 0 && idx + 1 < q.Length)
                {
                    var translation = q.Substring(idx + 1).Trim();

                    if (!string.IsNullOrWhiteSpace(translation))
                    {
                        pair = (correct, translation);
                        return true;
                    }
                }
            }

            return false;
        }

        private int GetLessonPoints(int correctAnswers)
        {
            var lessonCorrectAnswerScore = _learningSettings.LessonCorrectAnswerScore;

            if (lessonCorrectAnswerScore < 1)
            {
                lessonCorrectAnswerScore = 1;
            }

            if (correctAnswers <= 0)
            {
                return 0;
            }

            return correctAnswers * lessonCorrectAnswerScore;
        }
    }
}