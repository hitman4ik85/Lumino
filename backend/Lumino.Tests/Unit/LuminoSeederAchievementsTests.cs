using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using System.Reflection;
using Xunit;

namespace Lumino.Tests;

public class LuminoSeederAchievementsTests
{
    [Fact]
    public void SeedAchievements_ShouldAddNewSystemAchievements_AndKeepExistingAdminEdits()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Achievements.Add(new Achievement
        {
            Code = "sys.first_lesson",
            Title = "Моя назва",
            Description = "Мій опис"
        });

        dbContext.SaveChanges();

        var method = typeof(LuminoSeeder).GetMethod("SeedAchievements", BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(method);

        method!.Invoke(null, new object[] { dbContext });
        dbContext.SaveChanges();

        var firstLesson = dbContext.Achievements.First(x => x.Code == "sys.first_lesson");
        Assert.Equal("Моя назва", firstLesson.Title);
        Assert.Equal("Мій опис", firstLesson.Description);

        Assert.Contains(dbContext.Achievements, x => x.Code == "sys.first_day_learning");
        Assert.Contains(dbContext.Achievements, x => x.Code == "sys.first_topic_completed");
        Assert.Contains(dbContext.Achievements, x => x.Code == "sys.perfect_three_in_row");
        Assert.Contains(dbContext.Achievements, x => x.Code == "sys.return_after_break");
    }
}
