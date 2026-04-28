using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using Xunit;

namespace Lumino.Tests.Integration.Http;

public class StaticMediaCacheHeadersHttpIntegrationTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public StaticMediaCacheHeadersHttpIntegrationTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Uploads_ShouldReturnCacheControlHeader()
    {
        string testFilePath;

        using (var scope = _factory.Services.CreateScope())
        {
            var environment = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
            var webRootPath = string.IsNullOrWhiteSpace(environment.WebRootPath)
                ? Path.Combine(environment.ContentRootPath, "wwwroot")
                : environment.WebRootPath;
            var uploadsPath = Path.Combine(webRootPath, "uploads", "lessons");
            Directory.CreateDirectory(uploadsPath);
            testFilePath = Path.Combine(uploadsPath, "cache-test.png");
            await File.WriteAllBytesAsync(testFilePath, new byte[] { 1, 2, 3, 4 });
        }

        try
        {
            var client = _factory.CreateClient();
            var response = await client.GetAsync("/uploads/lessons/cache-test.png");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.True(response.Headers.TryGetValues("Cache-Control", out var values));

            var cacheControl = Assert.Single(values);
            var normalizedCacheControl = cacheControl.Replace(" ", string.Empty);

            Assert.Contains("public", normalizedCacheControl);
            Assert.Contains("max-age=604800", normalizedCacheControl);
            Assert.Contains("stale-while-revalidate=86400", normalizedCacheControl);
        }
        finally
        {
            if (File.Exists(testFilePath))
            {
                File.Delete(testFilePath);
            }
        }
    }
}
