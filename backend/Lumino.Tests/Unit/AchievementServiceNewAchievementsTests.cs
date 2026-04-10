using Lumino.Api.Application.Services;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;
using Xunit;

namespace Lumino.Tests;

public class AchievementServiceNewAchievementsTests
{
    [Fact]
    public void CheckAndGrantAchievements_ShouldGrantFirstStudyDay_WhenUserHasAnyLearningActivity()
    {
        var dbContext = TestDbContextFactory.Create();
        var userId = 10;

        dbContext.LessonResults.Add(new LessonResult
        {
            UserId = userId,
            LessonId = 1,
            Score = 4,
            TotalQuestions = 4,
            CompletedAt = new DateTime(2026, 3, 1, 10, 0, 0, DateTimeKind.Utc)
        });

        dbContext.SaveChanges();

        var service = new AchievementService(
            dbContext,
            new FixedDateTimeProvider(new DateTime(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc)),
            Options.Create(new LearningSettings { PassingScorePercent = 80 }));

        service.CheckAndGrantAchievements(userId, 4, 4);

        var achievement = dbContext.Achievements.FirstOrDefault(x => x.Code == "sys.first_day_learning");
        Assert.NotNull(achievement);
        Assert.Contains(dbContext.UserAchievements, x => x.UserId == userId && x.AchievementId == achievement!.Id);
    }

    [Fact]
    public void CheckAndGrantAchievements_ShouldNotGrantFirstTopicCompleted_WhenOnlyTopicLessonsAreCompleted()
    {
        var dbContext = TestDbContextFactory.Create();
        var userId = 10;

        dbContext.Topics.Add(new Topic { Id = 1, CourseId = 1, Title = "Basics", Order = 1 });
        dbContext.Lessons.Add(new Lesson { Id = 1, TopicId = 1, Title = "L1", Theory = "T", Order = 1 });
        dbContext.Lessons.Add(new Lesson { Id = 2, TopicId = 1, Title = "L2", Theory = "T", Order = 2 });
        dbContext.UserLessonProgresses.Add(new UserLessonProgress { UserId = userId, LessonId = 1, IsCompleted = true, IsUnlocked = true });
        dbContext.UserLessonProgresses.Add(new UserLessonProgress { UserId = userId, LessonId = 2, IsCompleted = true, IsUnlocked = true });
        dbContext.LessonResults.Add(new LessonResult
        {
            UserId = userId,
            LessonId = 1,
            Score = 4,
            TotalQuestions = 4,
            CompletedAt = new DateTime(2026, 3, 2, 10, 0, 0, DateTimeKind.Utc)
        });

        dbContext.SaveChanges();

        var service = new AchievementService(
            dbContext,
            new FixedDateTimeProvider(new DateTime(2026, 3, 2, 12, 0, 0, DateTimeKind.Utc)),
            Options.Create(new LearningSettings { PassingScorePercent = 80 }));

        service.CheckAndGrantAchievements(userId, 4, 4);

        var achievement = dbContext.Achievements.FirstOrDefault(x => x.Code == "sys.first_topic_completed");

        if (achievement != null)
        {
            Assert.DoesNotContain(dbContext.UserAchievements, x => x.UserId == userId && x.AchievementId == achievement.Id);
        }
    }

    [Fact]
    public void CheckAndGrantSceneAchievements_ShouldGrantFirstTopicCompleted_WhenTopicSceneIsCompleted()
    {
        var dbContext = TestDbContextFactory.Create();
        var userId = 10;

        dbContext.Topics.Add(new Topic { Id = 1, CourseId = 1, Title = "Basics", Order = 1 });
        dbContext.Scenes.Add(new Scene
        {
            Id = 1,
            CourseId = 1,
            TopicId = 1,
            Title = "Scene 1",
            Description = "Desc",
            SceneType = "scene",
            Order = 1
        });
        dbContext.SceneAttempts.Add(new SceneAttempt
        {
            UserId = userId,
            SceneId = 1,
            IsCompleted = true,
            Score = 1,
            TotalQuestions = 1,
            CompletedAt = new DateTime(2026, 3, 2, 10, 0, 0, DateTimeKind.Utc)
        });

        dbContext.SaveChanges();

        var service = new AchievementService(
            dbContext,
            new FixedDateTimeProvider(new DateTime(2026, 3, 2, 12, 0, 0, DateTimeKind.Utc)),
            Options.Create(new LearningSettings { PassingScorePercent = 80 }));

        service.CheckAndGrantSceneAchievements(userId);

        var achievement = dbContext.Achievements.FirstOrDefault(x => x.Code == "sys.first_topic_completed");
        Assert.NotNull(achievement);
        Assert.Contains(dbContext.UserAchievements, x => x.UserId == userId && x.AchievementId == achievement!.Id);
    }

    [Fact]
    public void CheckAndGrantAchievements_ShouldGrantNoMistakesStreak_WhenThreePerfectLessonsInRow()
    {
        var dbContext = TestDbContextFactory.Create();
        var userId = 10;

        dbContext.LessonResults.AddRange(
            new LessonResult { UserId = userId, LessonId = 1, Score = 4, TotalQuestions = 4, CompletedAt = new DateTime(2026, 3, 1, 10, 0, 0, DateTimeKind.Utc) },
            new LessonResult { UserId = userId, LessonId = 2, Score = 5, TotalQuestions = 5, CompletedAt = new DateTime(2026, 3, 2, 10, 0, 0, DateTimeKind.Utc) },
            new LessonResult { UserId = userId, LessonId = 3, Score = 6, TotalQuestions = 6, CompletedAt = new DateTime(2026, 3, 3, 10, 0, 0, DateTimeKind.Utc) }
        );

        dbContext.SaveChanges();

        var service = new AchievementService(
            dbContext,
            new FixedDateTimeProvider(new DateTime(2026, 3, 3, 12, 0, 0, DateTimeKind.Utc)),
            Options.Create(new LearningSettings { PassingScorePercent = 80 }));

        service.CheckAndGrantAchievements(userId, 6, 6);

        var achievement = dbContext.Achievements.FirstOrDefault(x => x.Code == "sys.perfect_three_in_row");
        Assert.NotNull(achievement);
        Assert.Contains(dbContext.UserAchievements, x => x.UserId == userId && x.AchievementId == achievement!.Id);
    }

    [Fact]
    public void CheckAndGrantAchievements_ShouldGrantWelcomeBack_WhenThereWasBreakOfThreeDaysOrMore()
    {
        var dbContext = TestDbContextFactory.Create();
        var userId = 10;

        dbContext.LessonResults.AddRange(
            new LessonResult { UserId = userId, LessonId = 1, Score = 4, TotalQuestions = 4, CompletedAt = new DateTime(2026, 3, 1, 10, 0, 0, DateTimeKind.Utc) },
            new LessonResult { UserId = userId, LessonId = 2, Score = 4, TotalQuestions = 4, CompletedAt = new DateTime(2026, 3, 5, 10, 0, 0, DateTimeKind.Utc) }
        );

        dbContext.SaveChanges();

        var service = new AchievementService(
            dbContext,
            new FixedDateTimeProvider(new DateTime(2026, 3, 5, 12, 0, 0, DateTimeKind.Utc)),
            Options.Create(new LearningSettings { PassingScorePercent = 80 }));

        service.CheckAndGrantAchievements(userId, 4, 4);

        var achievement = dbContext.Achievements.FirstOrDefault(x => x.Code == "sys.return_after_break");
        Assert.NotNull(achievement);
        Assert.Contains(dbContext.UserAchievements, x => x.UserId == userId && x.AchievementId == achievement!.Id);
    }
}
