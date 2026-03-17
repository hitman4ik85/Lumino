using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Application.Validators;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Xunit;

namespace Lumino.Tests;

public class UserAccountServiceDeleteAccountTests
{
    [Fact]
    public void DeleteAccount_WhenUserHasPasswordAndPasswordIsCorrect_ShouldDeleteUser()
    {
        using var dbContext = TestDbContextFactory.Create();
        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "user1@mail.com",
            PasswordHash = "hash:123456"
        });
        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var request = new DeleteAccountRequest
        {
            Password = "123456"
        };

        service.DeleteAccount(1, request);

        Assert.False(dbContext.Users.Any(x => x.Id == 1));
    }

    [Fact]
    public void DeleteAccount_WhenUserHasPasswordAndPasswordIsEmpty_ShouldThrow()
    {
        using var dbContext = TestDbContextFactory.Create();
        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "user2@mail.com",
            PasswordHash = "hash:123456"
        });
        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var request = new DeleteAccountRequest();

        Assert.Throws<ArgumentException>(() => service.DeleteAccount(1, request));
    }

    [Fact]
    public void DeleteAccount_WhenUserHasPasswordAndPasswordIsInvalid_ShouldThrow()
    {
        using var dbContext = TestDbContextFactory.Create();
        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "user3@mail.com",
            PasswordHash = "hash:123456"
        });
        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var request = new DeleteAccountRequest
        {
            Password = "654321"
        };

        Assert.Throws<UnauthorizedAccessException>(() => service.DeleteAccount(1, request));
    }

    [Fact]
    public void DeleteAccount_WhenUserIsGoogleOnlyAndPasswordIsEmpty_ShouldDeleteUser()
    {
        using var dbContext = TestDbContextFactory.Create();
        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "user4@mail.com",
            PasswordHash = string.Empty
        });
        dbContext.UserExternalLogins.Add(new UserExternalLogin
        {
            UserId = 1,
            Provider = "google",
            ProviderUserId = "google-1"
        });
        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var request = new DeleteAccountRequest();

        service.DeleteAccount(1, request);

        Assert.False(dbContext.Users.Any(x => x.Id == 1));
    }

    [Fact]
    public void DeleteAccount_WhenUserIsGoogleOnlyAndPasswordHashExists_ShouldDeleteUser()
    {
        using var dbContext = TestDbContextFactory.Create();
        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "user4_google@mail.com",
            PasswordHash = "hash:generated-random-password"
        });
        dbContext.UserExternalLogins.Add(new UserExternalLogin
        {
            UserId = 1,
            Provider = "google",
            ProviderUserId = "google-2"
        });
        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var request = new DeleteAccountRequest();

        service.DeleteAccount(1, request);

        Assert.False(dbContext.Users.Any(x => x.Id == 1));
    }

    [Fact]
    public void DeleteAccount_WhenUserHasNoPasswordAndNoGoogleLogin_ShouldThrow()
    {
        using var dbContext = TestDbContextFactory.Create();
        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "user5@mail.com",
            PasswordHash = string.Empty
        });
        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var request = new DeleteAccountRequest();

        Assert.Throws<UnauthorizedAccessException>(() => service.DeleteAccount(1, request));
    }

    private static UserAccountService CreateService(Lumino.Api.Data.LuminoDbContext dbContext)
    {
        return new UserAccountService(
            dbContext,
            new FakeChangePasswordRequestValidator(),
            new DeleteAccountRequestValidator(),
            new FakePasswordHasher());
    }

    private class FakeChangePasswordRequestValidator : IChangePasswordRequestValidator
    {
        public void Validate(ChangePasswordRequest request)
        {
        }
    }

    private class FakePasswordHasher : IPasswordHasher
    {
        public string Hash(string password)
        {
            return $"hash:{password}";
        }

        public bool Verify(string password, string passwordHash)
        {
            return passwordHash == $"hash:{password}";
        }

        public bool NeedsRehash(string storedHash)
        {
            return false;
        }
    }
}
