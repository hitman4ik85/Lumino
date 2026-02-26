using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Xunit;

namespace Lumino.Tests;

public class AdminAchievementServiceTests
{
    [Fact]
    public void Create_ShouldGenerateCode_WhenNotProvided()
    {
        var dbContext = TestDbContextFactory.Create();

        var service = new AdminAchievementService(dbContext);

        var created = service.Create(new Lumino.Api.Application.DTOs.CreateAchievementRequest
        {
            Title = "My Achievement",
            Description = "Desc"
        });

        Assert.True(created.Id > 0);
        Assert.False(string.IsNullOrWhiteSpace(created.Code));
        Assert.StartsWith("custom.", created.Code);
    }

    [Fact]
    public void Delete_ShouldThrow_WhenSystemAchievement()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Achievements.Add(new Achievement
        {
            Code = "sys.first_lesson",
            Title = "First Lesson",
            Description = "Complete your first lesson"
        });

        dbContext.SaveChanges();

        var service = new AdminAchievementService(dbContext);

        var sys = dbContext.Achievements.First(x => x.Code == "sys.first_lesson");

        var ex = Assert.Throws<ArgumentException>(() => service.Delete(sys.Id));
        Assert.Equal("System achievement cannot be deleted", ex.Message);
    }

    [Fact]
    public void Update_ShouldChangeTitleAndDescription()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Achievements.Add(new Achievement
        {
            Code = "custom.test",
            Title = "Old",
            Description = "OldDesc"
        });

        dbContext.SaveChanges();

        var service = new AdminAchievementService(dbContext);

        var a = dbContext.Achievements.First(x => x.Code == "custom.test");

        service.Update(a.Id, new Lumino.Api.Application.DTOs.UpdateAchievementRequest
        {
            Title = "New",
            Description = "NewDesc"
        });

        var updated = dbContext.Achievements.First(x => x.Id == a.Id);
        Assert.Equal("New", updated.Title);
        Assert.Equal("NewDesc", updated.Description);
        Assert.Equal("custom.test", updated.Code);
    }
}
