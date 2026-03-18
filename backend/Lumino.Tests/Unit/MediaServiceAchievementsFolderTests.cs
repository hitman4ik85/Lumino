using Lumino.Api.Application.Services;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace Lumino.Tests;

public class MediaServiceAchievementsFolderTests
{
    [Fact]
    public void Upload_WithAchievementsFolder_ShouldSaveFileToNestedDirectory_AndReturnNestedUrl()
    {
        var service = new MediaService();
        var originalDir = Directory.GetCurrentDirectory();
        var tempRoot = Path.Combine(Path.GetTempPath(), "LuminoMediaTests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            Directory.SetCurrentDirectory(tempRoot);

            using var ms = new MemoryStream(new byte[] { 1, 2, 3, 4 });
            var file = new FormFile(ms, 0, ms.Length, "file", "achievement.png")
            {
                Headers = new HeaderDictionary(),
                ContentType = "image/png"
            };

            var response = service.Upload(file, "http://localhost", "achievements");

            Assert.StartsWith("http://localhost/uploads/achievements/", response.Url);
            Assert.EndsWith(".png", response.FileName.ToLower());

            var savedPath = Path.Combine(tempRoot, "wwwroot", "uploads", "achievements", response.FileName);
            Assert.True(File.Exists(savedPath));
        }
        finally
        {
            Directory.SetCurrentDirectory(originalDir);
            try
            {
                if (Directory.Exists(tempRoot))
                {
                    Directory.Delete(tempRoot, recursive: true);
                }
            }
            catch { }
        }
    }

    [Fact]
    public void Upload_WithUnsafeFolder_ShouldNormalizeFolder_AndNotEscapeUploadsRoot()
    {
        var service = new MediaService();
        var originalDir = Directory.GetCurrentDirectory();
        var tempRoot = Path.Combine(Path.GetTempPath(), "LuminoMediaTests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            Directory.SetCurrentDirectory(tempRoot);

            using var ms = new MemoryStream(new byte[] { 10, 20, 30 });
            var file = new FormFile(ms, 0, ms.Length, "file", "achievement.webp")
            {
                Headers = new HeaderDictionary(),
                ContentType = "image/webp"
            };

            var response = service.Upload(file, "http://localhost", "../achievements/./icons");

            Assert.StartsWith("http://localhost/uploads/achievements/icons/", response.Url);

            var savedPath = Path.Combine(tempRoot, "wwwroot", "uploads", "achievements", "icons", response.FileName);
            Assert.True(File.Exists(savedPath));
            Assert.False(File.Exists(Path.Combine(tempRoot, response.FileName)));
        }
        finally
        {
            Directory.SetCurrentDirectory(originalDir);
            try
            {
                if (Directory.Exists(tempRoot))
                {
                    Directory.Delete(tempRoot, recursive: true);
                }
            }
            catch { }
        }
    }
}
