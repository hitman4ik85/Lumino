using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;
using Xunit;

namespace Lumino.Tests;

public class ProfileServiceTests
{
    [Fact]
    public void GetWeeklyProgress_ReturnsTwoWeeksAndTotalPoints()
    {
        var dbContext = TestDbContextFactory.Create();

        // Monday, so current week starts at 2026-02-23
        var now = new DateTime(2026, 2, 23, 12, 0, 0, DateTimeKind.Utc);
        var dateTimeProvider = new FixedDateTimeProvider(now);

        int userId = 1;

        // Previous week: first attempt on lesson 12
        dbContext.LessonResults.Add(new LessonResult
        {
            UserId = userId,
            LessonId = 12,
            Score = 3,
            TotalQuestions = 10,
            CompletedAt = new DateTime(2026, 2, 16, 10, 0, 0, DateTimeKind.Utc)
        });

        // Current week: first attempt on lesson 10
        dbContext.LessonResults.Add(new LessonResult
        {
            UserId = userId,
            LessonId = 10,
            Score = 5,
            TotalQuestions = 10,
            CompletedAt = new DateTime(2026, 2, 23, 10, 0, 0, DateTimeKind.Utc)
        });

        // Current week: first attempt on lesson 11
        dbContext.LessonResults.Add(new LessonResult
        {
            UserId = userId,
            LessonId = 11,
            Score = 7,
            TotalQuestions = 10,
            CompletedAt = new DateTime(2026, 2, 24, 10, 0, 0, DateTimeKind.Utc)
        });

        // Current week: retry on lesson 10 with improvement by 2 answers
        dbContext.LessonResults.Add(new LessonResult
        {
            UserId = userId,
            LessonId = 10,
            Score = 7,
            TotalQuestions = 10,
            CompletedAt = new DateTime(2026, 2, 24, 18, 0, 0, DateTimeKind.Utc)
        });

        // Current week: retry on lesson 11 without improvement, should not add points to chart
        dbContext.LessonResults.Add(new LessonResult
        {
            UserId = userId,
            LessonId = 11,
            Score = 6,
            TotalQuestions = 10,
            CompletedAt = new DateTime(2026, 2, 25, 11, 0, 0, DateTimeKind.Utc)
        });

        dbContext.SaveChanges();

        var service = new ProfileService(dbContext, dateTimeProvider, Options.Create(new LearningSettings { LessonCorrectAnswerScore = 5, SceneCompletionScore = 15 }));

        var result = service.GetWeeklyProgress(userId);

        Assert.NotNull(result);
        Assert.Equal(7, result.CurrentWeek.Count);
        Assert.Equal(7, result.PreviousWeek.Count);

        Assert.Equal(25, result.CurrentWeek[0].Points); // 2026-02-23
        Assert.Equal(45, result.CurrentWeek[1].Points); // 2026-02-24 => 35 + improvement 10
        Assert.Equal(0, result.CurrentWeek[2].Points);  // 2026-02-25 => no best-score improvement

        Assert.Equal(15, result.PreviousWeek[0].Points); // 2026-02-16
        Assert.Equal(0, result.PreviousWeek[1].Points);

        Assert.Equal(85, result.TotalPoints); // lesson 10 best=7, lesson 11 best=7, lesson 12 best=3
    }
}
