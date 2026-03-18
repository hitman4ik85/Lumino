using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Xunit;

namespace Lumino.Tests;

public class AdminAchievementServiceNewRulesTests
{
    [Fact]
    public void GetById_SystemAchievement_ShouldReturnCanEditDescriptionFalse()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Achievements.Add(new Achievement
        {
            Code = "sys.first_lesson",
            Title = "First Lesson",
            Description = "Complete your first lesson",
            ImageUrl = "/uploads/achievements/first.png"
        });

        dbContext.SaveChanges();

        var service = new AdminAchievementService(dbContext);
        var achievement = dbContext.Achievements.First(x => x.Code == "sys.first_lesson");

        var response = service.GetById(achievement.Id);

        Assert.True(response.IsSystem);
        Assert.False(response.CanEditDescription);
        Assert.Equal("First Lesson", response.Title);
        Assert.Equal("Complete your first lesson", response.Description);
        Assert.Equal("/uploads/achievements/first.png", response.ImageUrl);
    }

    [Fact]
    public void Update_SystemAchievement_ShouldChangeOnlyTitleAndImageUrl_AndKeepDescription()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Achievements.Add(new Achievement
        {
            Code = "sys.first_lesson",
            Title = "Old Title",
            Description = "System description",
            ImageUrl = "/uploads/old.png"
        });

        dbContext.SaveChanges();

        var service = new AdminAchievementService(dbContext);
        var achievement = dbContext.Achievements.First(x => x.Code == "sys.first_lesson");

        service.Update(achievement.Id, new UpdateAchievementRequest
        {
            Title = "New Title",
            Description = null,
            ImageUrl = "  /uploads/achievements/new-image.png  "
        });

        var updated = dbContext.Achievements.First(x => x.Id == achievement.Id);

        Assert.Equal("New Title", updated.Title);
        Assert.Equal("System description", updated.Description);
        Assert.Equal("/uploads/achievements/new-image.png", updated.ImageUrl);
    }

    [Fact]
    public void Update_CustomAchievement_ShouldRequireAndChangeDescription()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Achievements.Add(new Achievement
        {
            Code = "custom.test",
            Title = "Old",
            Description = "Old Description"
        });

        dbContext.SaveChanges();

        var service = new AdminAchievementService(dbContext);
        var achievement = dbContext.Achievements.First(x => x.Code == "custom.test");

        service.Update(achievement.Id, new UpdateAchievementRequest
        {
            Title = "New",
            Description = "New Description",
            ImageUrl = null
        });

        var updated = dbContext.Achievements.First(x => x.Id == achievement.Id);

        Assert.Equal("New", updated.Title);
        Assert.Equal("New Description", updated.Description);
        Assert.Null(updated.ImageUrl);
    }
}
