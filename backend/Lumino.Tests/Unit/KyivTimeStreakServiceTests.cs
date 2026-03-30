using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Xunit;

namespace Lumino.Tests;

public class KyivTimeStreakServiceTests
{
    [Fact]
    public void RegisterLessonActivity_AfterKyivMidnight_UsesKyivCalendarDate()
    {
        var dbContext = TestDbContextFactory.Create();
        var now = new DateTime(2026, 3, 29, 21, 30, 0, DateTimeKind.Utc);
        var dateTimeProvider = new FixedDateTimeProvider(now);
        var service = new StreakService(dbContext, dateTimeProvider);

        var user = new User
        {
            Email = "kyiv-streak@test.com",
            PasswordHash = "hash",
            Role = Lumino.Api.Domain.Enums.Role.User,
            CreatedAt = now
        };

        dbContext.Users.Add(user);
        dbContext.SaveChanges();

        service.RegisterLessonActivity(user.Id);

        var expectedKyivDate = new DateTime(2026, 3, 30, 0, 0, 0, DateTimeKind.Utc);
        var streak = dbContext.UserStreaks.Single(x => x.UserId == user.Id);
        var activity = dbContext.UserDailyActivities.Single(x => x.UserId == user.Id);

        Assert.Equal(expectedKyivDate, streak.LastActivityDateUtc);
        Assert.Equal(expectedKyivDate, activity.DateUtc);
    }

    [Fact]
    public void GetMyCalendarMonth_ReturnsCurrentKyivDateTimeText()
    {
        var dbContext = TestDbContextFactory.Create();
        var now = new DateTime(2026, 3, 29, 21, 30, 0, DateTimeKind.Utc);
        var dateTimeProvider = new FixedDateTimeProvider(now);
        var service = new StreakService(dbContext, dateTimeProvider);

        var user = new User
        {
            Email = "kyiv-calendar@test.com",
            PasswordHash = "hash",
            Role = Lumino.Api.Domain.Enums.Role.User,
            CreatedAt = now
        };

        dbContext.Users.Add(user);
        dbContext.SaveChanges();

        var result = service.GetMyCalendarMonth(user.Id, 2026, 3);

        Assert.Equal("30.03.2026 00:30", result.CurrentKyivDateTimeText);
    }
}
