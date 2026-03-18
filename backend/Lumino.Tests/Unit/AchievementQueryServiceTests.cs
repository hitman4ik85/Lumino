using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Xunit;

namespace Lumino.Tests;

public class AchievementQueryServiceTests
{
    [Fact]
    public void GetUserAchievements_InvalidUserId_ShouldThrow()
    {
        var dbContext = TestDbContextFactory.Create();

        var service = new AchievementQueryService(dbContext);

        var ex = Assert.Throws<ArgumentException>(() =>
        {
            service.GetUserAchievements(0);
        });

        Assert.Equal("UserId is invalid", ex.Message);
    }

    [Fact]
    public void GetUserAchievements_ReturnsAllAchievements_AndMarksEarnedState()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Achievements.AddRange(
            new Achievement { Id = 1, Code = "test.a1", Title = "A1", Description = "D1", ImageUrl = "/uploads/a1.png" },
            new Achievement { Id = 2, Code = "test.a2", Title = "A2", Description = "D2" }
        );

        var earned1 = new DateTime(2026, 2, 10, 10, 0, 0, DateTimeKind.Utc);
        var earned2 = new DateTime(2026, 2, 11, 10, 0, 0, DateTimeKind.Utc);

        dbContext.UserAchievements.AddRange(
            new UserAchievement { Id = 1, UserId = 5, AchievementId = 1, EarnedAt = earned1 },
            new UserAchievement { Id = 2, UserId = 6, AchievementId = 2, EarnedAt = earned2 },
            new UserAchievement { Id = 3, UserId = 5, AchievementId = 999, EarnedAt = earned2 }
        );

        dbContext.SaveChanges();

        var service = new AchievementQueryService(dbContext);

        var result = service.GetUserAchievements(5);

        Assert.Equal(2, result.Count);

        Assert.Equal(1, result[0].Id);
        Assert.Equal("test.a1", result[0].Code);
        Assert.Equal("A1", result[0].Title);
        Assert.Equal("D1", result[0].Description);
        Assert.True(result[0].IsEarned);
        Assert.Equal(earned1, result[0].EarnedAt);
        Assert.Equal("/uploads/a1.png", result[0].ImageUrl);

        Assert.Equal(2, result[1].Id);
        Assert.Equal("test.a2", result[1].Code);
        Assert.Equal("A2", result[1].Title);
        Assert.Equal("D2", result[1].Description);
        Assert.False(result[1].IsEarned);
        Assert.Null(result[1].EarnedAt);
        Assert.Null(result[1].ImageUrl);
    }
}
