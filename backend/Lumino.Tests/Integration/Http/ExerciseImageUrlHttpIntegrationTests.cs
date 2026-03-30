using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Text.Json;
using Xunit;

using System.IO;

namespace Lumino.Tests.Integration.Http;

public class ExerciseImageUrlHttpIntegrationTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public ExerciseImageUrlHttpIntegrationTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetExercises_ShouldReturnAbsoluteImageUrl_WhenExerciseHasRelativeImagePath()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<LuminoDbContext>();

            dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();

            dbContext.Courses.Add(new Course { Id = 1, Title = "Course", Description = "Desc", IsPublished = true });
            dbContext.Topics.Add(new Topic { Id = 1, CourseId = 1, Title = "Topic", Order = 1 });
            dbContext.Lessons.Add(new Lesson { Id = 1, TopicId = 1, Title = "Lesson", Theory = "Theory", Order = 1 });

            dbContext.UserLessonProgresses.Add(new UserLessonProgress
            {
                UserId = 10,
                LessonId = 1,
                IsUnlocked = true,
                IsCompleted = false,
                BestScore = 0,
                LastAttemptAt = DateTime.UtcNow
            });

            dbContext.Exercises.Add(new Exercise
            {
                Id = 1,
                LessonId = 1,
                Type = ExerciseType.MultipleChoice,
                Question = "червоний",
                Data = "[\"red\",\"blue\"]",
                CorrectAnswer = "red",
                Order = 1,
                ImageUrl = "/uploads/lessons/red.png"
            });

            dbContext.SaveChanges();
        }

        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/lessons/1/exercises");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var imageUrl = doc.RootElement[0].GetProperty("imageUrl").GetString();

        Assert.Equal(BuildExpectedInlineImage("red.png"), imageUrl);
    }

    [Fact]
    public async Task GetDemoExercises_ShouldReturnAbsoluteImageUrl_WhenExerciseHasRelativeImagePath()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<LuminoDbContext>();

            dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();

            dbContext.Courses.Add(new Course { Id = 1, Title = "Course", Description = "Desc", IsPublished = true });
            dbContext.Topics.Add(new Topic { Id = 10, CourseId = 1, Title = "Topic", Order = 1 });
            dbContext.Lessons.Add(new Lesson { Id = 1, TopicId = 10, Title = "Demo 1", Theory = "", Order = 1 });

            dbContext.Exercises.Add(new Exercise
            {
                Id = 101,
                LessonId = 1,
                Type = ExerciseType.MultipleChoice,
                Question = "собака",
                Data = "[\"dog\",\"cat\"]",
                CorrectAnswer = "dog",
                Order = 1,
                ImageUrl = "/uploads/lessons/dog.png"
            });

            dbContext.SaveChanges();
        }

        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/demo/lessons/1/exercises");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var imageUrl = doc.RootElement[0].GetProperty("imageUrl").GetString();

        Assert.Equal(BuildExpectedInlineImage("dog.png"), imageUrl);
    }


    [Fact]
    public async Task GetExercises_ShouldReturnAbsoluteImageUrl_WhenExerciseHasFullPhysicalImagePath()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<LuminoDbContext>();

            dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();

            dbContext.Courses.Add(new Course { Id = 1, Title = "Course", Description = "Desc", IsPublished = true });
            dbContext.Topics.Add(new Topic { Id = 1, CourseId = 1, Title = "Topic", Order = 1 });
            dbContext.Lessons.Add(new Lesson { Id = 1, TopicId = 1, Title = "Lesson", Theory = "Theory", Order = 1 });

            dbContext.UserLessonProgresses.Add(new UserLessonProgress
            {
                UserId = 10,
                LessonId = 1,
                IsUnlocked = true,
                IsCompleted = false,
                BestScore = 0,
                LastAttemptAt = DateTime.UtcNow
            });

            dbContext.Exercises.Add(new Exercise
            {
                Id = 1,
                LessonId = 1,
                Type = ExerciseType.MultipleChoice,
                Question = "червоний",
                Data = "[\"red\",\"blue\"]",
                CorrectAnswer = "red",
                Order = 1,
                ImageUrl = "backend/Lumino.API/wwwroot/uploads/lessons/red.png"
            });

            dbContext.SaveChanges();
        }

        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/lessons/1/exercises");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var imageUrl = doc.RootElement[0].GetProperty("imageUrl").GetString();

        Assert.Equal(BuildExpectedInlineImage("red.png"), imageUrl);
    }

    [Fact]
    public async Task GetDemoExercises_ShouldReturnAbsoluteImageUrl_WhenExerciseHasFullPhysicalImagePath()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<LuminoDbContext>();

            dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();

            dbContext.Courses.Add(new Course { Id = 1, Title = "Course", Description = "Desc", IsPublished = true });
            dbContext.Topics.Add(new Topic { Id = 10, CourseId = 1, Title = "Topic", Order = 1 });
            dbContext.Lessons.Add(new Lesson { Id = 1, TopicId = 10, Title = "Demo 1", Theory = "", Order = 1 });

            dbContext.Exercises.Add(new Exercise
            {
                Id = 101,
                LessonId = 1,
                Type = ExerciseType.MultipleChoice,
                Question = "собака",
                Data = "[\"dog\",\"cat\"]",
                CorrectAnswer = "dog",
                Order = 1,
                ImageUrl = "backend/Lumino.API/wwwroot/uploads/lessons/dog.png"
            });

            dbContext.SaveChanges();
        }

        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/demo/lessons/1/exercises");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var imageUrl = doc.RootElement[0].GetProperty("imageUrl").GetString();

        Assert.Equal(BuildExpectedInlineImage("dog.png"), imageUrl);
    }


    private static string BuildExpectedInlineImage(string fileName)
    {
        var imagePath = GetLessonImagePath(fileName);
        var bytes = File.ReadAllBytes(imagePath);
        var contentType = GetContentType(fileName);

        return $"data:{contentType};base64,{Convert.ToBase64String(bytes)}";
    }

    private static string GetLessonImagePath(string fileName)
    {
        var candidates = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "Lumino.API", "wwwroot", "uploads", "lessons", fileName),
            Path.Combine(Directory.GetCurrentDirectory(), "backend", "Lumino.API", "wwwroot", "uploads", "lessons", fileName),
            Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads", "lessons", fileName),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Lumino.API", "wwwroot", "uploads", "lessons", fileName))
        };

        var filePath = candidates.FirstOrDefault(File.Exists);

        if (filePath == null)
        {
            throw new FileNotFoundException($"Lesson image not found for test: {fileName}");
        }

        return filePath;
    }

    private static string GetContentType(string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();

        return ext switch
        {
            ".png" => "image/png",
            ".jpg" => "image/jpeg",
            ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }

}
