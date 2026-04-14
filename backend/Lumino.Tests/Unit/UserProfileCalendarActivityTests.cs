using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Application.Validators;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;
using Xunit;
using Lumino.Tests;

namespace Lumino.Tests.Unit
{
    public class UserProfileCalendarActivityTests
    {
        [Fact]
        public void GetCurrentUser_WhenOpenedToday_ShouldCreateTodayCalendarActivityWithoutChangingStreak()
        {
            var dbContext = TestDbContextFactory.Create();
            var now = new DateTime(2026, 3, 28, 10, 0, 0, DateTimeKind.Utc);

            dbContext.Users.Add(new User
            {
                Id = 1,
                Email = "calendar@test.com",
                PasswordHash = "hash",
                CreatedAt = now.AddDays(-5),
                Hearts = 5,
                Crystals = 0,
                Theme = "light"
            });

            dbContext.UserStreaks.Add(new UserStreak
            {
                UserId = 1,
                CurrentStreak = 3,
                BestStreak = 4,
                LastActivityDateUtc = now.AddDays(-1)
            });

            dbContext.SaveChanges();

            var settings = Options.Create(new LearningSettings
            {
                HeartsMax = 5,
                HeartRegenMinutes = 30,
                CrystalCostPerHeart = 10
            });

            var service = new UserService(dbContext, new FakeUpdateProfileRequestValidator(), settings, new FixedDateTimeProvider(now));

            var result = service.GetCurrentUser(1);

            var todayActivity = dbContext.UserDailyActivities.SingleOrDefault(x => x.UserId == 1 && x.DateUtc == now.Date);

            Assert.NotNull(todayActivity);
            Assert.Equal(3, result.CurrentStreakDays);
            Assert.Equal(4, result.BestStreakDays);
        }

        [Fact]
        public void GetCurrentUser_WhenUserDoesNotExist_ShouldThrowWithoutCreatingCalendarActivity()
        {
            var dbContext = TestDbContextFactory.Create();
            var now = new DateTime(2026, 3, 28, 10, 0, 0, DateTimeKind.Utc);

            var settings = Options.Create(new LearningSettings
            {
                HeartsMax = 5,
                HeartRegenMinutes = 30,
                CrystalCostPerHeart = 10
            });

            var service = new UserService(dbContext, new FakeUpdateProfileRequestValidator(), settings, new FixedDateTimeProvider(now));

            Assert.Throws<KeyNotFoundException>(() => service.GetCurrentUser(999));
            Assert.Empty(dbContext.UserDailyActivities);
        }

        private class FakeUpdateProfileRequestValidator : IUpdateProfileRequestValidator
        {
            public void Validate(UpdateProfileRequest request)
            {
            }
        }
    }
}
