using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Xunit;

namespace Lumino.Tests;

public class AdminAchievementServiceConditionTests
{
    [Fact]
    public void Create_ShouldPersistAutomaticCondition_WhenProvided()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new AdminAchievementService(dbContext);

        var created = service.Create(new CreateAchievementRequest
        {
            Title = "10 passed lessons",
            Description = "Pass 10 lessons",
            ConditionType = "LessonPassCount",
            ConditionThreshold = 10,
            ImageUrl = "/uploads/achievements/custom.png"
        });

        Assert.Equal("LessonPassCount", created.ConditionType);
        Assert.Equal(10, created.ConditionThreshold);

        var saved = dbContext.Achievements.First(x => x.Id == created.Id);
        Assert.Equal("LessonPassCount", saved.ConditionType);
        Assert.Equal(10, saved.ConditionThreshold);
    }

    [Fact]
    public void Update_CustomAchievement_ShouldPersistAutomaticCondition_WhenProvided()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Achievements.Add(new Achievement
        {
            Code = "custom.lessons_10",
            Title = "Old",
            Description = "Old description"
        });

        dbContext.SaveChanges();

        var service = new AdminAchievementService(dbContext);
        var achievement = dbContext.Achievements.First(x => x.Code == "custom.lessons_10");

        service.Update(achievement.Id, new UpdateAchievementRequest
        {
            Title = "New",
            Description = "New description",
            ConditionType = "UniqueLessonPassCount",
            ConditionThreshold = 10,
            ImageUrl = null
        });

        var updated = dbContext.Achievements.First(x => x.Id == achievement.Id);

        Assert.Equal("UniqueLessonPassCount", updated.ConditionType);
        Assert.Equal(10, updated.ConditionThreshold);
    }

    [Fact]
    public void Create_ShouldThrow_WhenThresholdIsProvidedWithoutConditionType()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new AdminAchievementService(dbContext);

        var ex = Assert.Throws<ArgumentException>(() => service.Create(new CreateAchievementRequest
        {
            Title = "Broken achievement",
            Description = "Broken",
            ConditionThreshold = 10
        }));

        Assert.Equal("Achievement condition type is required", ex.Message);
    }
}
