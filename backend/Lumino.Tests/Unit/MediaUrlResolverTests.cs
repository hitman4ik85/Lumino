using Lumino.Api.Utils;
using Xunit;

namespace Lumino.Tests.Unit;

public class MediaUrlResolverTests
{
    [Fact]
    public void ToAbsoluteUrl_ShouldReturnNull_WhenUrlIsEmpty()
    {
        var result = MediaUrlResolver.ToAbsoluteUrl("https://api.example.com", "   ");

        Assert.Null(result);
    }

    [Fact]
    public void ToAbsoluteUrl_ShouldKeepAbsoluteUrl_Unchanged()
    {
        var result = MediaUrlResolver.ToAbsoluteUrl("https://api.example.com", "https://cdn.example.com/image.png");

        Assert.Equal("https://cdn.example.com/image.png", result);
    }

    [Fact]
    public void ToAbsoluteUrl_ShouldAppendBaseUrl_ForRootRelativePath()
    {
        var result = MediaUrlResolver.ToAbsoluteUrl("https://api.example.com/", "/uploads/lessons/red.png");

        Assert.Equal("https://api.example.com/uploads/lessons/red.png", result);
    }

    [Fact]
    public void NormalizeLessonImageUrl_ShouldExtractPublicUploadsPath_FromPhysicalPath()
    {
        var result = MediaUrlResolver.NormalizeLessonImageUrl(@"backend/Lumino.API/wwwroot/uploads/lessons/red.png");

        Assert.Equal("/uploads/lessons/red.png", result);
    }

    [Fact]
    public void NormalizeLessonImageUrl_ShouldPrefixFileName_WithLessonsUploadsPath()
    {
        var result = MediaUrlResolver.NormalizeLessonImageUrl("red.png");

        Assert.Equal("/uploads/lessons/red.png", result);
    }

    [Fact]
    public void ResolveLessonImageForClient_ShouldReturnDataUrl_WhenLessonImageFileExists()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), $"lumino-media-{Guid.NewGuid():N}");
        Directory.CreateDirectory(Path.Combine(tempRoot, "wwwroot", "uploads", "lessons"));

        try
        {
            var filePath = Path.Combine(tempRoot, "wwwroot", "uploads", "lessons", "dog.png");
            File.WriteAllBytes(filePath, new byte[] { 137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4 });

            var environment = new FakeHostEnvironment
            {
                ContentRootPath = tempRoot,
                WebRootPath = Path.Combine(tempRoot, "wwwroot")
            };

            var result = MediaUrlResolver.ResolveLessonImageForClient(environment, "https://api.example.com", "/uploads/lessons/dog.png");

            Assert.NotNull(result);
            Assert.StartsWith("data:image/png;base64,", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    [Fact]
    public void ResolveLessonImageForClient_ShouldFallbackToAbsoluteUrl_WhenLessonImageFileDoesNotExist()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), $"lumino-media-{Guid.NewGuid():N}");
        Directory.CreateDirectory(Path.Combine(tempRoot, "wwwroot", "uploads", "lessons"));

        try
        {
            var environment = new FakeHostEnvironment
            {
                ContentRootPath = tempRoot,
                WebRootPath = Path.Combine(tempRoot, "wwwroot")
            };

            var result = MediaUrlResolver.ResolveLessonImageForClient(environment, "https://api.example.com", "/uploads/lessons/dog.png");

            Assert.Equal("https://api.example.com/uploads/lessons/dog.png", result);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }
}
