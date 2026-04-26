using System.Security.Cryptography;
using System.Text;
using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Application.Validators;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;
using Lumino.Api.Utils;
using Lumino.Tests.Stubs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace Lumino.Tests.Unit;

public class AuthForgotPasswordEmailTests
{
    [Fact]
    public void ForgotPassword_WhenUserExists_ShouldSendEmail_AndNotExposeToken()
    {
        var options = new DbContextOptionsBuilder<LuminoDbContext>()
            .UseInMemoryDatabase("ForgotPasswordEmail_" + Guid.NewGuid().ToString("N"))
            .Options;

        using var db = new LuminoDbContext(options);

        var user = new User
        {
            Email = "test@lumino.com",
            PasswordHash = "hash",
            Role = Role.User,
            CreatedAt = DateTime.UtcNow,
            Username = "test",
            AvatarUrl = null
        };

        db.Users.Add(user);
        db.SaveChanges();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "CHANGE_ME",
                ["Jwt:Issuer"] = "Lumino.Api",
                ["Jwt:Audience"] = "Lumino.Client",
                ["Jwt:ExpiresMinutes"] = "60",
                ["Email:FrontendBaseUrl"] = "http://localhost:5173"
            })
            .Build();

        var registerValidator = new FakeRegisterValidator();
        var loginValidator = new FakeLoginValidator();
        var forgotValidator = new FakeForgotPasswordValidator();
        var resetValidator = new FakeResetPasswordValidator();

        var env = new TestHostEnvironment("Production");

        var fakeEmail = new FakeEmailSender();
        var hasher = new PasswordHasher();
        var openIdValidator = new FakeOpenIdTokenValidator();

        var service = new AuthService(
            db,
            config,
            registerValidator,
            loginValidator,
            forgotValidator,
            resetValidator,
            new VerifyEmailRequestValidator(),
            new ResendVerificationRequestValidator(),
            fakeEmail,
            openIdValidator,
            env,
            hasher
        );

        var response = service.ForgotPassword(new ForgotPasswordRequest { Email = "test@lumino.com" }, null, null);

        Assert.True(response.IsSent);
        Assert.Null(response.ResetToken);
        Assert.Null(response.ExpiresAtUtc);

        Assert.Equal(1, fakeEmail.SendCallsCount);
        Assert.Equal("test@lumino.com", fakeEmail.LastToEmail);
        Assert.False(string.IsNullOrWhiteSpace(fakeEmail.LastHtmlBody));
        Assert.Contains("email=test%40lumino.com", fakeEmail.LastHtmlBody!, StringComparison.OrdinalIgnoreCase);
    }


    [Fact]
    public void ResetPassword_ShouldInvalidatePreviousSessions()
    {
        var options = new DbContextOptionsBuilder<LuminoDbContext>()
            .UseInMemoryDatabase("ResetPasswordSessions_" + Guid.NewGuid().ToString("N"))
            .Options;

        using var db = new LuminoDbContext(options);

        var user = new User
        {
            Id = 7,
            Email = "reset@lumino.com",
            PasswordHash = new PasswordHasher().Hash("oldpass"),
            Role = Role.User,
            CreatedAt = DateTime.UtcNow,
            Username = "reset-user",
            SessionVersion = 3,
        };

        db.Users.Add(user);
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = 7,
            TokenHash = "refresh-token-hash",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        var rawResetToken = "known-reset-token";
        using var sha256 = SHA256.Create();
        var resetTokenHash = Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(rawResetToken)));

        db.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = 7,
            TokenHash = resetTokenHash,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30)
        });

        db.SaveChanges();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "CHANGE_ME",
                ["Jwt:Issuer"] = "Lumino.Api",
                ["Jwt:Audience"] = "Lumino.Client",
                ["Jwt:ExpiresMinutes"] = "60",
                ["Email:FrontendBaseUrl"] = "http://localhost:5173"
            })
            .Build();

        var service = new AuthService(
            db,
            config,
            new FakeRegisterValidator(),
            new FakeLoginValidator(),
            new FakeForgotPasswordValidator(),
            new FakeResetPasswordValidator(),
            new VerifyEmailRequestValidator(),
            new ResendVerificationRequestValidator(),
            new FakeEmailSender(),
            new FakeOpenIdTokenValidator(),
            new TestHostEnvironment("Production"),
            new PasswordHasher()
        );

        service.ResetPassword(new ResetPasswordRequest
        {
            Token = rawResetToken,
            NewPassword = "newpass123"
        });

        var refreshedUser = db.Users.Single(x => x.Id == 7);
        var refreshedToken = db.RefreshTokens.Single(x => x.UserId == 7);
        var resetEntry = db.PasswordResetTokens.Single(x => x.UserId == 7);

        Assert.Equal(4, refreshedUser.SessionVersion);
        Assert.NotNull(refreshedToken.RevokedAt);
        Assert.NotNull(resetEntry.UsedAt);
        Assert.True(new PasswordHasher().Verify("newpass123", refreshedUser.PasswordHash));
    }
}
