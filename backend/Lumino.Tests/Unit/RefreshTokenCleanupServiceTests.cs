using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Lumino.Tests;

public class RefreshTokenCleanupServiceTests
{
    [Fact]
    public void GetAll_ShouldReturnTokensWithUserDataAndStatuses()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.Add(new User
        {
            Id = 7,
            Email = "admin@lumino.test",
            Username = "Admin",
            PasswordHash = "hash",
            Role = Lumino.Api.Domain.Enums.Role.Admin,
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        });

        var now = DateTime.UtcNow;

        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = 7,
            TokenHash = "active_hash",
            CreatedAt = now.AddMinutes(-10),
            ExpiresAt = now.AddDays(10),
            RevokedAt = null,
            ReplacedByTokenHash = "next_hash"
        });

        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = 7,
            TokenHash = "revoked_hash",
            CreatedAt = now.AddDays(-1),
            ExpiresAt = now.AddDays(5),
            RevokedAt = now.AddHours(-2)
        });

        dbContext.SaveChanges();

        var service = new RefreshTokenCleanupService(dbContext, CreateConfiguration(keepRevokedDays: 30));

        var tokens = service.GetAll();

        Assert.Equal(2, tokens.Count);

        var active = tokens.First(x => x.TokenHash == "active_hash");
        var revoked = tokens.First(x => x.TokenHash == "revoked_hash");

        Assert.Equal(7, active.UserId);
        Assert.Equal("Admin", active.Username);
        Assert.Equal("admin@lumino.test", active.Email);
        Assert.Equal("Admin", active.Role);
        Assert.Equal("next_hash", active.ReplacedByTokenHash);
        Assert.True(active.IsActive);
        Assert.False(active.IsRevoked);
        Assert.False(active.IsExpired);

        Assert.True(revoked.IsRevoked);
        Assert.False(revoked.IsActive);
    }

    [Fact]
    public void Cleanup_ShouldDeleteExpiredTokens_AndOldRevokedTokens()
    {
        var dbContext = TestDbContextFactory.Create();

        var configuration = CreateConfiguration(keepRevokedDays: 1);

        var now = DateTime.UtcNow;

        // Expired token -> must be deleted
        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = 1,
            TokenHash = "expired",
            CreatedAt = now.AddDays(-10),
            ExpiresAt = now.AddDays(-1),
            RevokedAt = null
        });

        // Revoked old enough -> must be deleted (keepRevokedDays=1)
        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = 1,
            TokenHash = "revoked_old",
            CreatedAt = now.AddDays(-10),
            ExpiresAt = now.AddDays(10),
            RevokedAt = now.AddDays(-2)
        });

        // Active valid -> must remain
        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = 1,
            TokenHash = "active",
            CreatedAt = now.AddHours(-1),
            ExpiresAt = now.AddDays(10),
            RevokedAt = null
        });

        // Revoked but still within keep window -> must remain
        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = 1,
            TokenHash = "revoked_recent",
            CreatedAt = now.AddDays(-2),
            ExpiresAt = now.AddDays(10),
            RevokedAt = now.AddHours(-12)
        });

        dbContext.SaveChanges();

        var service = new RefreshTokenCleanupService(dbContext, configuration);

        var deleted = service.Cleanup();

        Assert.Equal(2, deleted);

        var hashes = dbContext.RefreshTokens.Select(x => x.TokenHash).ToList();

        Assert.DoesNotContain("expired", hashes);
        Assert.DoesNotContain("revoked_old", hashes);

        Assert.Contains("active", hashes);
        Assert.Contains("revoked_recent", hashes);
    }

    [Fact]
    public void Cleanup_WhenNothingToDelete_ShouldReturnZero()
    {
        var dbContext = TestDbContextFactory.Create();

        var configuration = CreateConfiguration(keepRevokedDays: 30);

        var now = DateTime.UtcNow;

        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = 1,
            TokenHash = "active",
            CreatedAt = now.AddHours(-1),
            ExpiresAt = now.AddDays(10),
            RevokedAt = null
        });

        dbContext.SaveChanges();

        var service = new RefreshTokenCleanupService(dbContext, configuration);

        var deleted = service.Cleanup();

        Assert.Equal(0, deleted);
    }

    [Fact]
    public void Cleanup_WithDeleteRevokedNow_ShouldDeleteRecentlyRevokedTokens()
    {
        var dbContext = TestDbContextFactory.Create();

        var configuration = CreateConfiguration(keepRevokedDays: 30);

        var now = DateTime.UtcNow;

        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = 1,
            TokenHash = "revoked_recent",
            CreatedAt = now.AddDays(-2),
            ExpiresAt = now.AddDays(10),
            RevokedAt = now.AddMinutes(-10)
        });

        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = 1,
            TokenHash = "active",
            CreatedAt = now.AddHours(-1),
            ExpiresAt = now.AddDays(10),
            RevokedAt = null
        });

        dbContext.SaveChanges();

        var service = new RefreshTokenCleanupService(dbContext, configuration);

        var deleted = service.Cleanup(deleteRevokedNow: true);

        Assert.Equal(1, deleted);

        var hashes = dbContext.RefreshTokens.Select(x => x.TokenHash).ToList();

        Assert.DoesNotContain("revoked_recent", hashes);
        Assert.Contains("active", hashes);
    }

    private static IConfiguration CreateConfiguration(int keepRevokedDays)
    {
        var data = new Dictionary<string, string?>
        {
            ["RefreshToken:KeepRevokedDays"] = keepRevokedDays.ToString()
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(data)
            .Build();
    }
}
