using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Xunit;

namespace Lumino.Tests;

public class OnboardingServiceTests
{
    [Fact]
    public void GetSupportedLanguages_ReturnsList()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new OnboardingService(dbContext);

        var result = service.GetSupportedLanguages();

        Assert.NotEmpty(result);
        Assert.Contains(result, x => x.Code == "en");
        Assert.DoesNotContain(result, x => x.Code == "uk");
    }

    [Fact]
    public void UpdateMyLanguages_SavesToUser()
    {
        var dbContext = TestDbContextFactory.Create();

        var user = new User
        {
            Email = "u@mail.com",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Users.Add(user);
        dbContext.SaveChanges();

        var service = new OnboardingService(dbContext);

        service.UpdateMyLanguages(user.Id, new UpdateUserLanguagesRequest
        {
            NativeLanguageCode = "pl",
            TargetLanguageCode = "en"
        });

        var fromDb = dbContext.Users.First(x => x.Id == user.Id);
        Assert.Equal("pl", fromDb.NativeLanguageCode);
        Assert.Equal("en", fromDb.TargetLanguageCode);
    }

    [Fact]
    public void UpdateMyLanguages_SameLanguages_ShouldThrow()
    {
        var dbContext = TestDbContextFactory.Create();

        var user = new User
        {
            Email = "u2@mail.com",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Users.Add(user);
        dbContext.SaveChanges();

        var service = new OnboardingService(dbContext);

        Assert.Throws<ArgumentException>(() =>
        {
            service.UpdateMyLanguages(user.Id, new UpdateUserLanguagesRequest
            {
                NativeLanguageCode = "en",
                TargetLanguageCode = "en"
            });
        });
    }
}
