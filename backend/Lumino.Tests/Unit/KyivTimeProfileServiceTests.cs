using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;
using Xunit;

namespace Lumino.Tests;

public class KyivTimeProfileServiceTests
{
    [Fact]
    public void GetWeeklyProgress_LateUtcSundayResult_GoesToKyivMonday()
    {
        var dbContext = TestDbContextFactory.Create();
        var now = new DateTime(2026, 3, 30, 9, 0, 0, DateTimeKind.Utc);
        var dateTimeProvider = new FixedDateTimeProvider(now);
        var userId = 1;

        dbContext.LessonResults.Add(new LessonResult
        {
            UserId = userId,
            LessonId = 10,
            Score = 4,
            TotalQuestions = 10,
            CompletedAt = new DateTime(2026, 3, 29, 22, 30, 0, DateTimeKind.Utc)
        });

        dbContext.SaveChanges();

        var service = new ProfileService(
            dbContext,
            dateTimeProvider,
            Options.Create(new LearningSettings
            {
                LessonCorrectAnswerScore = 5,
                SceneCompletionScore = 15
            })
        );

        var result = service.GetWeeklyProgress(userId);

        Assert.Equal(20, result.CurrentWeek[0].Points);
        Assert.Equal(0, result.PreviousWeek[6].Points);
    }
}
