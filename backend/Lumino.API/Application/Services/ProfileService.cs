using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;

namespace Lumino.Api.Application.Services
{
    public class ProfileService : IProfileService
    {
        private readonly LuminoDbContext _dbContext;
        private readonly IDateTimeProvider _dateTimeProvider;
        private readonly LearningSettings _learningSettings;

        public ProfileService(LuminoDbContext dbContext, IDateTimeProvider dateTimeProvider, IOptions<LearningSettings> learningSettings)
        {
            _dbContext = dbContext;
            _dateTimeProvider = dateTimeProvider;
            _learningSettings = learningSettings.Value;
        }

        public WeeklyProgressResponse GetWeeklyProgress(int userId)
        {
            var todayKyiv = KyivDateTimeHelper.GetKyivDate(_dateTimeProvider.UtcNow);

            // Monday as start of week
            int offset = ((int)todayKyiv.DayOfWeek + 6) % 7;
            var currentWeekStart = todayKyiv.AddDays(-offset);
            var currentWeekEnd = currentWeekStart.AddDays(6);

            var previousWeekStart = currentWeekStart.AddDays(-7);
            var previousWeekEnd = previousWeekStart.AddDays(6);

            var lessonPointDeltas = BuildLessonPointDeltasByDate(userId);

            var currentLessonPoints = lessonPointDeltas
                .Where(x => x.Key >= currentWeekStart && x.Key <= currentWeekEnd)
                .ToDictionary(x => x.Key, x => x.Value);

            var (currentWeekStartUtc, currentWeekEndUtc) = KyivDateTimeHelper.GetUtcRangeForKyivDateRange(currentWeekStart, currentWeekEnd.AddDays(1));
            var currentScenePoints = _dbContext.SceneAttempts
                .Where(x => x.UserId == userId && x.IsCompleted && x.CompletedAt >= currentWeekStartUtc && x.CompletedAt < currentWeekEndUtc)
                .AsEnumerable()
                .GroupBy(x => KyivDateTimeHelper.GetKyivDate(x.CompletedAt))
                .ToDictionary(x => x.Key, x => x.Select(v => v.SceneId).Distinct().Count() * _learningSettings.SceneCompletionScore);

            var previousLessonPoints = lessonPointDeltas
                .Where(x => x.Key >= previousWeekStart && x.Key <= previousWeekEnd)
                .ToDictionary(x => x.Key, x => x.Value);

            var (previousWeekStartUtc, previousWeekEndUtc) = KyivDateTimeHelper.GetUtcRangeForKyivDateRange(previousWeekStart, previousWeekEnd.AddDays(1));
            var previousScenePoints = _dbContext.SceneAttempts
                .Where(x => x.UserId == userId && x.IsCompleted && x.CompletedAt >= previousWeekStartUtc && x.CompletedAt < previousWeekEndUtc)
                .AsEnumerable()
                .GroupBy(x => KyivDateTimeHelper.GetKyivDate(x.CompletedAt))
                .ToDictionary(x => x.Key, x => x.Select(v => v.SceneId).Distinct().Count() * _learningSettings.SceneCompletionScore);

            var totalLessonPoints = lessonPointDeltas.Values.Sum();

            var totalScenePoints = _dbContext.SceneAttempts
                .Where(x => x.UserId == userId && x.IsCompleted)
                .Select(x => x.SceneId)
                .Distinct()
                .Count() * _learningSettings.SceneCompletionScore;

            var result = new WeeklyProgressResponse
            {
                TotalPoints = totalLessonPoints + totalScenePoints
            };

            for (var i = 0; i < 7; i++)
            {
                var date = currentWeekStart.AddDays(i);
                result.CurrentWeek.Add(new WeeklyProgressDayResponse
                {
                    DateUtc = date,
                    Points = (currentLessonPoints.TryGetValue(date, out var lessonPoints) ? lessonPoints : 0)
                        + (currentScenePoints.TryGetValue(date, out var scenePoints) ? scenePoints : 0)
                });
            }

            for (var i = 0; i < 7; i++)
            {
                var date = previousWeekStart.AddDays(i);
                result.PreviousWeek.Add(new WeeklyProgressDayResponse
                {
                    DateUtc = date,
                    Points = (previousLessonPoints.TryGetValue(date, out var lessonPoints) ? lessonPoints : 0)
                        + (previousScenePoints.TryGetValue(date, out var scenePoints) ? scenePoints : 0)
                });
            }

            return result;
        }

        private Dictionary<DateTime, int> BuildLessonPointDeltasByDate(int userId)
        {
            var results = _dbContext.LessonResults
                .Where(x => x.UserId == userId)
                .OrderBy(x => x.CompletedAt)
                .ThenBy(x => x.Id)
                .ToList();

            var bestScoresByLesson = new Dictionary<int, int>();
            var pointsByDate = new Dictionary<DateTime, int>();

            foreach (var result in results)
            {
                bestScoresByLesson.TryGetValue(result.LessonId, out var previousBestScore);

                var improvement = result.Score - previousBestScore;

                if (improvement <= 0)
                {
                    continue;
                }

                bestScoresByLesson[result.LessonId] = result.Score;

                var completedDate = KyivDateTimeHelper.GetKyivDate(result.CompletedAt);
                var earnedPoints = GetLessonPoints(improvement);

                if (!pointsByDate.ContainsKey(completedDate))
                {
                    pointsByDate[completedDate] = 0;
                }

                pointsByDate[completedDate] += earnedPoints;
            }

            return pointsByDate;
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
