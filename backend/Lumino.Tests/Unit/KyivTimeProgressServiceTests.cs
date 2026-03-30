using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;
using Xunit;

namespace Lumino.Tests;

public class KyivTimeProgressServiceTests
{
    [Fact]
    public void GetMyDailyGoal_AfterKyivMidnight_CountsKyivDayActivity()
    {
        var dbContext = TestDbContextFactory.Create();
        var now = new DateTime(2026, 3, 29, 21, 30, 0, DateTimeKind.Utc);
        var dateTimeProvider = new FixedDateTimeProvider(now);

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "English A1",
            Description = "Demo",
            IsPublished = true
        });

        dbContext.Topics.Add(new Topic
        {
            Id = 1,
            CourseId = 1,
            Title = "Basics",
            Order = 1
        });

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            TopicId = 1,
            Title = "L1",
            Theory = "T1",
            Order = 1
        });

        dbContext.LessonResults.Add(new LessonResult
        {
            UserId = 1,
            LessonId = 1,
            Score = 4,
            TotalQuestions = 4,
            CompletedAt = new DateTime(2026, 3, 29, 21, 10, 0, DateTimeKind.Utc)
        });

        dbContext.SaveChanges();

        var service = new ProgressService(
            dbContext,
            dateTimeProvider,
            Options.Create(new LearningSettings
            {
                PassingScorePercent = 80,
                DailyGoalScoreTarget = 10,
                LessonCorrectAnswerScore = 5,
                SceneCompletionScore = 15
            })
        );

        var result = service.GetMyDailyGoal(1);

        Assert.Equal(new DateTime(2026, 3, 30, 0, 0, 0, DateTimeKind.Utc), result.DateUtc);
        Assert.Equal(20, result.TodayScore);
        Assert.True(result.IsGoalMet);
        Assert.Equal(1, result.TodayPassedLessons);
    }
}
