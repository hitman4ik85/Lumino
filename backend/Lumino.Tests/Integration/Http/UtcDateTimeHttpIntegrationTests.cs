using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Text.Json;
using Xunit;

namespace Lumino.Tests.Integration.Http;

public class UtcDateTimeHttpIntegrationTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public UtcDateTimeHttpIntegrationTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetMe_WhenCreatedAtStoredWithoutKind_ShouldSerializeUtcSuffix()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<LuminoDbContext>();

            dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();

            dbContext.Users.Add(new User
            {
                Id = 10,
                Email = "utc-created@test.com",
                PasswordHash = "hash",
                CreatedAt = DateTime.SpecifyKind(new DateTime(2026, 3, 29, 23, 14, 0), DateTimeKind.Unspecified),
                Hearts = 5,
                Crystals = 0,
                Theme = "light"
            });

            dbContext.SaveChanges();
        }

        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/user/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var createdAt = doc.RootElement.GetProperty("createdAt").GetString();

        Assert.Equal("2026-03-29T23:14:00Z", createdAt);
    }

    [Fact]
    public async Task GetMe_WhenNextHeartAtStoredWithoutKind_ShouldSerializeUtcSuffix()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<LuminoDbContext>();

            dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();

            dbContext.Users.Add(new User
            {
                Id = 10,
                Email = "utc-hearts@test.com",
                PasswordHash = "hash",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                Hearts = 3,
                HeartsUpdatedAtUtc = DateTime.SpecifyKind(DateTime.UtcNow.AddMinutes(-5), DateTimeKind.Unspecified),
                Crystals = 0,
                Theme = "light"
            });

            dbContext.SaveChanges();
        }

        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/user/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var nextHeartAtUtc = doc.RootElement.GetProperty("nextHeartAtUtc").GetString();

        Assert.False(string.IsNullOrWhiteSpace(nextHeartAtUtc));
        Assert.EndsWith("Z", nextHeartAtUtc);
    }
}
