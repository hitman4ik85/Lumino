using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Application.Validators;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;
using Lumino.Api.Utils;
using Microsoft.Extensions.Configuration;
using Xunit;
using Lumino.Tests.Stubs;

namespace Lumino.Tests;

public class AccountCredentialsRulesTests
{
    private static IConfiguration CreateConfig()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Avatars:Allowed:0"] = "/avatars/alien-1.png"
            })
            .Build();
    }

    [Fact]
    public void RegisterValidator_WithNumericOnlyUsername_ShouldThrow()
    {
        var validator = new RegisterRequestValidator(CreateConfig());

        var ex = Assert.Throws<ArgumentException>(() => validator.Validate(new RegisterRequest
        {
            Username = "12345678",
            Email = "user@mail.com",
            Password = "abc12345",
            TargetLanguageCode = "en"
        }));

        Assert.Contains("must contain at least one letter", ex.Message);
    }

    [Fact]
    public void RegisterValidator_WithPasswordWithoutLetter_ShouldThrow()
    {
        var validator = new RegisterRequestValidator(CreateConfig());

        var ex = Assert.Throws<ArgumentException>(() => validator.Validate(new RegisterRequest
        {
            Username = "Valid User",
            Email = "user@mail.com",
            Password = "12345678",
            TargetLanguageCode = "en"
        }));

        Assert.Contains("must contain at least one letter", ex.Message);
    }

    [Fact]
    public void RegisterValidator_WithPasswordWithoutDigit_ShouldThrow()
    {
        var validator = new RegisterRequestValidator(CreateConfig());

        var ex = Assert.Throws<ArgumentException>(() => validator.Validate(new RegisterRequest
        {
            Username = "Valid User",
            Email = "user@mail.com",
            Password = "abcdefgh",
            TargetLanguageCode = "en"
        }));

        Assert.Contains("must contain at least one digit", ex.Message);
    }

    [Fact]
    public void ChangePasswordValidator_WithWeakPassword_ShouldThrow()
    {
        var validator = new ChangePasswordRequestValidator();

        var ex = Assert.Throws<ArgumentException>(() => validator.Validate(new ChangePasswordRequest
        {
            OldPassword = "oldpass1",
            NewPassword = "12345678",
            ConfirmPassword = "12345678"
        }));

        Assert.Contains("must contain at least one letter", ex.Message);
    }

    [Fact]
    public void ResetPasswordValidator_WithWeakPassword_ShouldThrow()
    {
        var validator = new ResetPasswordRequestValidator();

        var ex = Assert.Throws<ArgumentException>(() => validator.Validate(new ResetPasswordRequest
        {
            Token = "abcdefghijklmnopqrstuvwxyz",
            NewPassword = "abcdefgh",
            ConfirmPassword = "abcdefgh"
        }));

        Assert.Contains("must contain at least one digit", ex.Message);
    }

    [Fact]
    public void AuthService_Register_WithNumericEmailLocalPart_ShouldGenerateUsernameWithLetter()
    {
        var dbContext = TestDbContextFactory.Create();
        var configuration = CreateConfig();

        var service = new AuthService(
            dbContext,
            configuration,
            new RegisterRequestValidator(configuration),
            new LoginRequestValidator(),
            new ForgotPasswordRequestValidator(),
            new ResetPasswordRequestValidator(),
            new VerifyEmailRequestValidator(),
            new ResendVerificationRequestValidator(),
            new FakeEmailSender(),
            new FakeOpenIdTokenValidator(),
            new FakeHostEnvironment(),
            new PasswordHasher());

        service.Register(new RegisterRequest
        {
            Email = "11111111@lumino.local",
            Password = "abc12345"
        });

        var user = dbContext.Users.Single(x => x.Email == "11111111@lumino.local");

        Assert.False(string.IsNullOrWhiteSpace(user.Username));
        Assert.Contains(user.Username!, ch => char.IsLetter(ch));
    }

    [Fact]
    public void AdminUserService_Create_WithNumericOnlyUsername_ShouldThrow()
    {
        var dbContext = TestDbContextFactory.Create();
        var configuration = CreateConfig();

        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "admin@lumino.local",
            PasswordHash = "hash",
            Role = Role.Admin,
            CreatedAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = new AdminUserService(dbContext, configuration, new PasswordHasher());

        var ex = Assert.Throws<ArgumentException>(() => service.Create(new AdminUserUpsertRequest
        {
            Username = "12345678",
            Email = "new-user@lumino.local",
            Password = "abc12345",
            Role = "User"
        }, 1));

        Assert.Contains("must contain at least one letter", ex.Message);
    }

    [Fact]
    public void AdminUserService_Update_AllowsLegacyNumericUsername_WhenUsernameIsUnchanged()
    {
        var dbContext = TestDbContextFactory.Create();
        var configuration = CreateConfig();

        dbContext.Users.AddRange(
            new User
            {
                Id = 1,
                Email = "admin@lumino.local",
                PasswordHash = "hash",
                Role = Role.Admin,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Username = "12345678",
                Email = "legacy-user@lumino.local",
                PasswordHash = "hash",
                Role = Role.User,
                CreatedAt = DateTime.UtcNow,
                Theme = "light"
            });

        dbContext.SaveChanges();

        var service = new AdminUserService(dbContext, configuration, new PasswordHasher());

        var result = service.Update(2, new AdminUserUpsertRequest
        {
            Username = "12345678",
            Email = "legacy-user-updated@lumino.local",
            Password = null,
            Role = "User",
            Theme = "dark"
        }, 1);

        Assert.Equal("12345678", result.Username);
        Assert.Equal("legacy-user-updated@lumino.local", result.Email);
        Assert.Equal("dark", result.Theme);
    }
}
