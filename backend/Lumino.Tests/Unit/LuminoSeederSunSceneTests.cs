using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Xunit;
using System.Reflection;

namespace Lumino.Tests;

public class LuminoSeederSunSceneTests
{
    [Fact]
    public void EnsureFinalSceneForTopic_WhenDialogSceneExists_ShouldReuseIt_AndMarkAsSun_WithoutDuplicate()
    {
        using var dbContext = TestDbContextFactory.Create();

        var course = new Course
        {
            Id = 1,
            Title = "English A1",
            Description = "Desc",
            IsPublished = true,
            LanguageCode = "en"
        };

        var topic = new Topic
        {
            Id = 10,
            CourseId = 1,
            Title = "Buy clothes",
            Order = 1
        };

        // This scene is seeded by SeedScenes() and initially not linked to the course/topic.
        var dialogScene = new Scene
        {
            Id = 100,
            CourseId = null,
            TopicId = null,
            Order = 1,
            Title = "Cafe order",
            Description = "Dialog scene",
            SceneType = "Dialog"
        };

        dbContext.Courses.Add(course);
        dbContext.Topics.Add(topic);
        dbContext.Scenes.Add(dialogScene);
        dbContext.SaveChanges();

        var method = typeof(LuminoSeeder).GetMethod("EnsureFinalSceneForTopic", BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(method);

        method!.Invoke(null, new object[] { dbContext, course, topic });

        dbContext.SaveChanges();

        var sunScenes = dbContext.Scenes
            .Where(x => x.CourseId == course.Id && x.TopicId == topic.Id && x.SceneType == "Sun")
            .ToList();

        Assert.Single(sunScenes);

        var sun = sunScenes[0];
        Assert.Equal("Cafe order", sun.Title);
        Assert.Equal(1000 + topic.Order, sun.Order);

        // No other scenes should be linked to this topic/course by seeder (avoid duplicates).
        var allLinkedToTopic = dbContext.Scenes
            .Where(x => x.CourseId == course.Id && x.TopicId == topic.Id)
            .ToList();

        Assert.Single(allLinkedToTopic);
    }


    [Fact]
    public void EnsureFinalSceneForTopic_WhenSceneTitleAlreadyUsedByAnotherCourse_ShouldCreateOwnScene_AndNotStealExistingOne()
    {
        using var dbContext = TestDbContextFactory.Create();

        var firstCourse = new Course
        {
            Id = 1,
            Title = "English A1",
            Description = "Desc",
            IsPublished = true,
            LanguageCode = "en"
        };

        var secondCourse = new Course
        {
            Id = 2,
            Title = "English A2",
            Description = "Desc",
            IsPublished = true,
            LanguageCode = "en"
        };

        var firstTopic = new Topic
        {
            Id = 10,
            CourseId = 1,
            Title = "Buy clothes",
            Order = 1
        };

        var secondTopic = new Topic
        {
            Id = 20,
            CourseId = 2,
            Title = "Buy clothes",
            Order = 1
        };

        var existingFirstCourseScene = new Scene
        {
            Id = 100,
            CourseId = 1,
            TopicId = 10,
            Order = 1001,
            Title = "Cafe order",
            Description = "Dialog scene",
            SceneType = "Sun"
        };

        dbContext.Courses.AddRange(firstCourse, secondCourse);
        dbContext.Topics.AddRange(firstTopic, secondTopic);
        dbContext.Scenes.Add(existingFirstCourseScene);
        dbContext.SaveChanges();

        var method = typeof(LuminoSeeder).GetMethod("EnsureFinalSceneForTopic", BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(method);

        method!.Invoke(null, new object[] { dbContext, secondCourse, secondTopic });

        dbContext.SaveChanges();

        var firstCourseScenes = dbContext.Scenes
            .Where(x => x.CourseId == firstCourse.Id && x.TopicId == firstTopic.Id)
            .ToList();

        var secondCourseScenes = dbContext.Scenes
            .Where(x => x.CourseId == secondCourse.Id && x.TopicId == secondTopic.Id)
            .ToList();

        Assert.Single(firstCourseScenes);
        Assert.Single(secondCourseScenes);

        Assert.Equal(100, firstCourseScenes[0].Id);
        Assert.Equal("Cafe order", firstCourseScenes[0].Title);
        Assert.Equal("Sun", firstCourseScenes[0].SceneType);

        Assert.NotEqual(100, secondCourseScenes[0].Id);
        Assert.Equal("Buy clothes - Sun", secondCourseScenes[0].Title);
        Assert.Equal("Sun", secondCourseScenes[0].SceneType);
        Assert.Equal(1001, secondCourseScenes[0].Order);
    }



    [Fact]
    public void EnsureFinalSceneForTopic_WhenOwnSunSceneExistsWithoutSteps_ShouldBackfillStepsFromTemplateScene()
    {
        using var dbContext = TestDbContextFactory.Create();

        var firstCourse = new Course
        {
            Id = 1,
            Title = "English A1",
            Description = "Desc",
            IsPublished = true,
            LanguageCode = "en"
        };

        var secondCourse = new Course
        {
            Id = 2,
            Title = "English A2",
            Description = "Desc",
            IsPublished = true,
            LanguageCode = "en"
        };

        var firstTopic = new Topic
        {
            Id = 10,
            CourseId = 1,
            Title = "Basic words",
            Order = 1
        };

        var secondTopic = new Topic
        {
            Id = 20,
            CourseId = 2,
            Title = "Basic words",
            Order = 1
        };

        var templateScene = new Scene
        {
            Id = 100,
            CourseId = 1,
            TopicId = 10,
            Order = 1001,
            Title = "Cafe order",
            Description = "Order a coffee in a cafe",
            SceneType = "Sun"
        };

        var emptySecondCourseScene = new Scene
        {
            Id = 110,
            CourseId = 2,
            TopicId = 20,
            Order = 1001,
            Title = "Basic words - Sun",
            Description = "Final topic scene (sun)",
            SceneType = "Sun"
        };

        dbContext.Courses.AddRange(firstCourse, secondCourse);
        dbContext.Topics.AddRange(firstTopic, secondTopic);
        dbContext.Scenes.AddRange(templateScene, emptySecondCourseScene);
        dbContext.SceneSteps.Add(new SceneStep
        {
            SceneId = 100,
            Order = 1,
            Speaker = "Barista",
            Text = "Hi! What would you like?",
            StepType = "Line",
            MediaUrl = null,
            ChoicesJson = null
        });
        dbContext.SaveChanges();

        var method = typeof(LuminoSeeder).GetMethod("EnsureFinalSceneForTopic", BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(method);

        method!.Invoke(null, new object[] { dbContext, secondCourse, secondTopic });

        dbContext.SaveChanges();

        var secondCourseSceneSteps = dbContext.SceneSteps
            .Where(x => x.SceneId == emptySecondCourseScene.Id)
            .OrderBy(x => x.Order)
            .ToList();

        Assert.Single(secondCourseSceneSteps);
        Assert.Equal("Hi! What would you like?", secondCourseSceneSteps[0].Text);

        var secondCourseScene = dbContext.Scenes.First(x => x.Id == emptySecondCourseScene.Id);
        Assert.Equal("Order a coffee in a cafe", secondCourseScene.Description);
    }

}