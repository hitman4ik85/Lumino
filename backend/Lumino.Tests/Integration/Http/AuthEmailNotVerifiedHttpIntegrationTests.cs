using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace Lumino.Tests.Integration.Http;

public class AuthEmailNotVerifiedHttpIntegrationTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public AuthEmailNotVerifiedHttpIntegrationTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Login_EmailNotVerified_ShouldReturnProblemDetailsWithCode()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<LuminoDbContext>();

            dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();

            var hasher = new PasswordHasher();

            dbContext.Users.Add(new User
            {
                Id = 1,
                Email = "test@mail.com",
                PasswordHash = hasher.Hash("123456"),
                CreatedAt = DateTime.UtcNow,
                IsEmailVerified = false
            });

            dbContext.SaveChanges();
        }

        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "test@mail.com",
            password = "123456"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        Assert.Contains("application/problem+json", response.Content.Headers.ContentType?.ToString() ?? "");

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var root = doc.RootElement;

        Assert.Equal("email_not_verified", root.GetProperty("type").GetString());
        Assert.Equal(401, root.GetProperty("status").GetInt32());

        var detail = root.GetProperty("detail").GetString() ?? "";
        Assert.Contains("Email not verified", detail);
    }
}
