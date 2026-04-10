using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;
using Xunit;

namespace Lumino.Tests;

public class AchievementServiceCustomAchievementTests
{
    [Fact]
    public void CheckAndGrantAchievements_ShouldGrantCustomAchievement_WhenLessonPassCountReached()
    {
        var dbContext = TestDbContextFactory.Create();
        var userId = 15;

        dbContext.Achievements.Add(new Achievement
        {
            Code = "custom.lesson_pass_10",
            Title = "Lesson master",
            Description = "Pass 10 lessons",
            ConditionType = "LessonPassCount",
            ConditionThreshold = 10
        });

        for (var index = 1; index <= 10; index++)
        {
            dbContext.LessonResults.Add(new LessonResult
            {
                UserId = userId,
                LessonId = index,
                Score = 5,
                TotalQuestions = 5,
                CompletedAt = new DateTime(2026, 4, index, 10, 0, 0, DateTimeKind.Utc)
            });
        }

        dbContext.SaveChanges();

        var service = new AchievementService(
            dbContext,
            new FixedDateTimeProvider(new DateTime(2026, 4, 10, 12, 0, 0, DateTimeKind.Utc)),
            Options.Create(new LearningSettings { PassingScorePercent = 80 }));

        service.CheckAndGrantAchievements(userId, 5, 5);

        var achievement = dbContext.Achievements.First(x => x.Code == "custom.lesson_pass_10");
        Assert.Contains(dbContext.UserAchievements, x => x.UserId == userId && x.AchievementId == achievement.Id);
    }

    [Fact]
    public void CheckAndGrantSceneAchievements_ShouldGrantCustomAchievement_WhenTotalXpReached()
    {
        var dbContext = TestDbContextFactory.Create();
        var userId = 25;

        dbContext.Achievements.Add(new Achievement
        {
            Code = "custom.total_xp_150",
            Title = "XP hunter",
            Description = "Earn 150 XP",
            ConditionType = "TotalXp",
            ConditionThreshold = 150
        });

        dbContext.LessonResults.AddRange(
            new LessonResult
            {
                UserId = userId,
                LessonId = 1,
                Score = 30,
                TotalQuestions = 30,
                CompletedAt = new DateTime(2026, 4, 1, 10, 0, 0, DateTimeKind.Utc)
            },
            new LessonResult
            {
                UserId = userId,
                LessonId = 2,
                Score = 30,
                TotalQuestions = 30,
                CompletedAt = new DateTime(2026, 4, 2, 10, 0, 0, DateTimeKind.Utc)
            });

        dbContext.SceneAttempts.Add(new SceneAttempt
        {
            UserId = userId,
            SceneId = 1,
            IsCompleted = true,
            CompletedAt = new DateTime(2026, 4, 3, 9, 10, 0, DateTimeKind.Utc),
            Score = 0,
            TotalQuestions = 0
        });

        dbContext.SaveChanges();

        var service = new AchievementService(
            dbContext,
            new FixedDateTimeProvider(new DateTime(2026, 4, 3, 12, 0, 0, DateTimeKind.Utc)),
            Options.Create(new LearningSettings
            {
                PassingScorePercent = 80,
                LessonCorrectAnswerScore = 2,
                SceneCompletionScore = 100
            }));

        service.CheckAndGrantSceneAchievements(userId);

        var achievement = dbContext.Achievements.First(x => x.Code == "custom.total_xp_150");
        Assert.Contains(dbContext.UserAchievements, x => x.UserId == userId && x.AchievementId == achievement.Id);
    }
}
