using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Lumino.Api.Application.Services
{
    public class AchievementService : IAchievementService
    {
        private const string FirstDayLearningCode = "sys.first_day_learning";
        private const string FirstLessonCode = "sys.first_lesson";
        private const string FiveLessonsCode = "sys.five_lessons";
        private const string PerfectLessonCode = "sys.perfect_lesson";
        private const string PerfectThreeInRowCode = "sys.perfect_three_in_row";
        private const string HundredXpCode = "sys.hundred_xp";
        private const string FirstSceneCode = "sys.first_scene";
        private const string FiveScenesCode = "sys.five_scenes";
        private const string FirstTopicCompletedCode = "sys.first_topic_completed";
        private const string StreakStarterCode = "sys.streak_starter";
        private const string Streak7Code = "sys.streak_7";
        private const string Streak30Code = "sys.streak_30";
        private const string DailyGoalCode = "sys.daily_goal";
        private const string ReturnAfterBreakCode = "sys.return_after_break";

        private readonly LuminoDbContext _dbContext;
        private readonly IDateTimeProvider _dateTimeProvider;
        private readonly LearningSettings _learningSettings;

        public AchievementService(
            LuminoDbContext dbContext,
            IDateTimeProvider dateTimeProvider,
            IOptions<LearningSettings> learningSettings)
        {
            _dbContext = dbContext;
            _dateTimeProvider = dateTimeProvider;
            _learningSettings = learningSettings.Value;
        }

        public void CheckAndGrantAchievements(int userId, int lessonScore, int totalQuestions)
        {
            if (userId <= 0)
            {
                throw new ArgumentException("UserId is invalid");
            }

            if (lessonScore < 0 || totalQuestions < 0)
            {
                throw new ArgumentException("Lesson result values are invalid");
            }

            GrantFirstDayLearning(userId);
            GrantFirstLesson(userId);
            GrantFiveLessons(userId);
            GrantPerfectLesson(userId, lessonScore, totalQuestions);
            GrantPerfectThreeInRow(userId);
            GrantHundredXp(userId);
            GrantFirstTopicCompleted(userId);
            GrantReturnAfterBreak(userId);

            // Streak achievements (study days)
            GrantStreakStarter(userId);
            GrantStreak7(userId);
            GrantStreak30(userId);

            // Daily goal
            GrantDailyGoal(userId);
        }

        public void CheckAndGrantSceneAchievements(int userId)
        {
            if (userId <= 0)
            {
                throw new ArgumentException("UserId is invalid");
            }

            GrantFirstDayLearning(userId);
            GrantFirstScene(userId);
            GrantFiveScenes(userId);
            GrantFirstTopicCompleted(userId);
            GrantReturnAfterBreak(userId);

            // Streak achievements (study days)
            GrantStreakStarter(userId);
            GrantStreak7(userId);
            GrantStreak30(userId);

            // Daily goal
            GrantDailyGoal(userId);
        }

        private void GrantFirstDayLearning(int userId)
        {
            bool hasAnyActivity = _dbContext.LessonResults.Any(x => x.UserId == userId)
                || _dbContext.SceneAttempts.Any(x => x.UserId == userId && x.IsCompleted);

            if (!hasAnyActivity) return;

            var achievement = GetOrCreateAchievement(
                FirstDayLearningCode,
                "First Study Day",
                "Complete your first study day"
            );

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private void GrantFirstLesson(int userId)
        {
            int passingScorePercent = LessonPassingRules.NormalizePassingPercent(_learningSettings.PassingScorePercent);

            int passedDistinctLessons = _dbContext.LessonResults
                .Where(x =>
                    x.UserId == userId &&
                    x.TotalQuestions > 0 &&
                    x.Score * 100 >= x.TotalQuestions * passingScorePercent
                )
                .Select(x => x.LessonId)
                .Distinct()
                .Count();

            if (passedDistinctLessons < 1) return;

            var achievement = GetOrCreateAchievement(
                FirstLessonCode,
                "First Lesson",
                "Complete your first lesson"
            );

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private void GrantFiveLessons(int userId)
        {
            int passingScorePercent = LessonPassingRules.NormalizePassingPercent(_learningSettings.PassingScorePercent);

            int passedDistinctLessons = _dbContext.LessonResults
                .Where(x =>
                    x.UserId == userId &&
                    x.TotalQuestions > 0 &&
                    x.Score * 100 >= x.TotalQuestions * passingScorePercent
                )
                .Select(x => x.LessonId)
                .Distinct()
                .Count();

            if (passedDistinctLessons < 5) return;

            var achievement = GetOrCreateAchievement(
                FiveLessonsCode,
                "5 Lessons Completed",
                "Complete 5 lessons"
            );

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private void GrantPerfectLesson(int userId, int score, int total)
        {
            if (total <= 0 || score != total) return;

            var achievement = GetOrCreateAchievement(
                PerfectLessonCode,
                "Perfect Lesson",
                "Complete a lesson without mistakes"
            );

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private void GrantPerfectThreeInRow(int userId)
        {
            int maxPerfectStreak = CalculateMaxPerfectLessonStreak(userId);

            if (maxPerfectStreak < 3) return;

            var achievement = GetOrCreateAchievement(
                PerfectThreeInRowCode,
                "No Mistakes Streak",
                "Complete 3 lessons in a row without mistakes"
            );

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private void GrantHundredXp(int userId)
        {
            var achievement = GetOrCreateAchievement(
                HundredXpCode,
                "500 XP",
                "Earn 500 total score"
            );

            int lessonsScore = _dbContext.LessonResults
                .Where(x => x.UserId == userId)
                .GroupBy(x => x.LessonId)
                .Select(g => g.Max(x => x.Score))
                .AsEnumerable()
                .Sum(GetLessonPoints);

            int completedDistinctScenes = _dbContext.SceneAttempts
                .Where(x => x.UserId == userId && x.IsCompleted)
                .Select(x => x.SceneId)
                .Distinct()
                .Count();

            int scenesScore = completedDistinctScenes * _learningSettings.SceneCompletionScore;
            int totalScore = lessonsScore + scenesScore;

            if (totalScore < 500)
            {
                var userAchievement = _dbContext.UserAchievements
                    .FirstOrDefault(x => x.UserId == userId && x.AchievementId == achievement.Id);

                if (userAchievement != null)
                {
                    _dbContext.UserAchievements.Remove(userAchievement);
                    _dbContext.SaveChanges();
                }

                return;
            }

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private void GrantFirstScene(int userId)
        {
            int completedDistinctScenes = _dbContext.SceneAttempts
                .Where(x => x.UserId == userId && x.IsCompleted)
                .Select(x => x.SceneId)
                .Distinct()
                .Count();

            if (completedDistinctScenes < 1) return;

            var achievement = GetOrCreateAchievement(
                FirstSceneCode,
                "First Scene",
                "Complete your first scene"
            );

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private void GrantFiveScenes(int userId)
        {
            int completedDistinctScenes = _dbContext.SceneAttempts
                .Where(x => x.UserId == userId && x.IsCompleted)
                .Select(x => x.SceneId)
                .Distinct()
                .Count();

            if (completedDistinctScenes < 5) return;

            var achievement = GetOrCreateAchievement(
                FiveScenesCode,
                "5 Scenes Completed",
                "Complete 5 scenes"
            );

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private void GrantFirstTopicCompleted(int userId)
        {
            int completedTopics = CalculateCompletedTopicsCount(userId);

            if (completedTopics < 1) return;

            var achievement = GetOrCreateAchievement(
                FirstTopicCompletedCode,
                "First Topic Completed",
                "Complete your first topic"
            );

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private void GrantDailyGoal(int userId)
        {
            var nowUtc = _dateTimeProvider.UtcNow;
            var todayKyiv = KyivDateTimeHelper.GetKyivDate(nowUtc);
            var (todayStartUtc, tomorrowStartUtc) = KyivDateTimeHelper.GetUtcRangeForKyivDate(todayKyiv);

            int passingScorePercent = LessonPassingRules.NormalizePassingPercent(_learningSettings.PassingScorePercent);

            var todayPassedLessons = _dbContext.LessonResults
                .Where(x =>
                    x.UserId == userId &&
                    x.CompletedAt >= todayStartUtc &&
                    x.CompletedAt < tomorrowStartUtc &&
                    x.TotalQuestions > 0 &&
                    x.Score * 100 >= x.TotalQuestions * passingScorePercent
                )
                .ToList();

            var todayCompletedScenes = _dbContext.SceneAttempts
                .Where(x =>
                    x.UserId == userId &&
                    x.IsCompleted &&
                    x.CompletedAt >= todayStartUtc &&
                    x.CompletedAt < tomorrowStartUtc
                )
                .ToList();

            int todayScore = todayPassedLessons.Sum(x => GetLessonPoints(x.Score)) + todayCompletedScenes.Select(x => x.SceneId).Distinct().Count() * _learningSettings.SceneCompletionScore;
            int targetScore = _learningSettings.DailyGoalScoreTarget;

            if (targetScore < 1)
            {
                targetScore = 1;
            }

            if (todayScore < targetScore) return;

            var achievement = GetOrCreateAchievement(
                DailyGoalCode,
                "Daily Goal",
                "Reach your daily goal"
            );

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private void GrantReturnAfterBreak(int userId)
        {
            bool returnedAfterBreak = HasReturnedAfterBreak(userId);

            if (!returnedAfterBreak) return;

            var achievement = GetOrCreateAchievement(
                ReturnAfterBreakCode,
                "Welcome Back",
                "Return to learning after a break"
            );

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private void GrantStreakStarter(int userId)
        {
            int maxStreak = CalculateUserMaxStreak(userId);

            if (maxStreak < 3) return;

            var achievement = GetOrCreateAchievement(
                StreakStarterCode,
                "Streak Starter",
                "Study 3 days in a row"
            );

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private void GrantStreak7(int userId)
        {
            int maxStreak = CalculateUserMaxStreak(userId);

            if (maxStreak < 7) return;

            var achievement = GetOrCreateAchievement(
                Streak7Code,
                "Streak 7",
                "Study 7 days in a row"
            );

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private void GrantStreak30(int userId)
        {
            int maxStreak = CalculateUserMaxStreak(userId);

            if (maxStreak < 30) return;

            var achievement = GetOrCreateAchievement(
                Streak30Code,
                "Streak 30",
                "Study 30 days in a row"
            );

            GrantToUserIfNotExists(userId, achievement.Id);
        }

        private int CalculateCompletedTopicsCount(int userId)
        {
            var completedLessonIds = _dbContext.UserLessonProgresses
                .Where(x => x.UserId == userId && x.IsCompleted)
                .Select(x => x.LessonId)
                .ToHashSet();

            if (completedLessonIds.Count == 0)
            {
                return 0;
            }

            var topicLessonData = _dbContext.Lessons
                .Select(x => new { x.TopicId, x.Id })
                .ToList();

            return topicLessonData
                .GroupBy(x => x.TopicId)
                .Count(g => g.All(x => completedLessonIds.Contains(x.Id)));
        }

        private int CalculateMaxPerfectLessonStreak(int userId)
        {
            var orderedResults = _dbContext.LessonResults
                .Where(x => x.UserId == userId && x.TotalQuestions > 0)
                .OrderBy(x => x.CompletedAt)
                .Select(x => new { x.Score, x.TotalQuestions })
                .ToList();

            int max = 0;
            int current = 0;

            foreach (var item in orderedResults)
            {
                if (item.Score == item.TotalQuestions)
                {
                    current++;
                    if (current > max)
                    {
                        max = current;
                    }

                    continue;
                }

                current = 0;
            }

            return max;
        }

        private bool HasReturnedAfterBreak(int userId)
        {
            var activityDates = GetDistinctActivityDates(userId);

            if (activityDates.Count < 2)
            {
                return false;
            }

            for (int i = 1; i < activityDates.Count; i++)
            {
                double daysBetween = (activityDates[i] - activityDates[i - 1]).TotalDays;

                if (daysBetween >= 3)
                {
                    return true;
                }
            }

            return false;
        }

        private List<DateTime> GetDistinctActivityDates(int userId)
        {
            int passingScorePercent = LessonPassingRules.NormalizePassingPercent(_learningSettings.PassingScorePercent);

            var passedLessonDates = _dbContext.LessonResults
                .Where(x =>
                    x.UserId == userId &&
                    x.TotalQuestions > 0 &&
                    x.Score * 100 >= x.TotalQuestions * passingScorePercent
                )
                .Select(x => x.CompletedAt)
                .AsEnumerable()
                .Select(KyivDateTimeHelper.GetKyivDate)
                .ToList();

            var sceneDates = _dbContext.SceneAttempts
                .Where(x => x.UserId == userId && x.IsCompleted)
                .Select(x => x.CompletedAt)
                .AsEnumerable()
                .Select(KyivDateTimeHelper.GetKyivDate)
                .ToList();

            return passedLessonDates
                .Concat(sceneDates)
                .Distinct()
                .OrderBy(x => x)
                .ToList();
        }

        private int CalculateUserMaxStreak(int userId)
        {
            var dates = GetDistinctActivityDates(userId);

            return CalculateMaxStreak(dates);
        }

        private static int CalculateMaxStreak(List<DateTime> datesSortedAsc)
        {
            if (datesSortedAsc == null || datesSortedAsc.Count == 0)
            {
                return 0;
            }

            int max = 1;
            int current = 1;

            for (int i = 1; i < datesSortedAsc.Count; i++)
            {
                if (datesSortedAsc[i] == datesSortedAsc[i - 1].AddDays(1))
                {
                    current++;
                    if (current > max) max = current;
                    continue;
                }

                current = 1;
            }

            return max;
        }

        private Achievement GetOrCreateAchievement(string code, string title, string description)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                throw new ArgumentException("Achievement code is required");
            }

            var achievement = _dbContext.Achievements.FirstOrDefault(x => x.Code == code);

            if (achievement != null)
            {
                return achievement;
            }

            achievement = new Achievement
            {
                Code = code,
                Title = title,
                Description = description
            };

            _dbContext.Achievements.Add(achievement);
            _dbContext.SaveChanges();

            return _dbContext.Achievements.First(x => x.Code == code);
        }

        private void GrantToUserIfNotExists(int userId, int achievementId)
        {
            bool alreadyHas = _dbContext.UserAchievements
                .Any(x => x.UserId == userId && x.AchievementId == achievementId);

            if (alreadyHas) return;

            _dbContext.UserAchievements.Add(new UserAchievement
            {
                UserId = userId,
                AchievementId = achievementId,
                EarnedAt = _dateTimeProvider.UtcNow
            });

            try
            {
                _dbContext.SaveChanges();
            }
            catch (DbUpdateException)
            {
                bool exists = _dbContext.UserAchievements
                    .Any(x => x.UserId == userId && x.AchievementId == achievementId);

                if (!exists) throw;
            }
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