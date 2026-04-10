using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Application.Validators;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;
using Xunit;

namespace Lumino.Tests;

public class AdminCourseServiceTests
{
    [Fact]
    public void GetById_ReturnsAllScenesForCourse_AndMapsSceneToTopic()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "English A1",
            Description = "Desc",
            IsPublished = true,
            LanguageCode = "en"
        });

        dbContext.Topics.AddRange(
            new Topic { Id = 10, CourseId = 1, Title = "Topic 1", Order = 1 },
            new Topic { Id = 20, CourseId = 1, Title = "Topic 2", Order = 2 }
        );

        dbContext.Scenes.AddRange(
            new Scene { Id = 100, CourseId = 1, TopicId = 10, Title = "Scene 1", Description = "D1", SceneType = "Sun", Order = 1001 },
            new Scene { Id = 200, CourseId = 1, TopicId = null, Title = "Scene 2", Description = "D2", SceneType = "Sun", Order = 1002 }
        );

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var result = service.GetById(1);

        Assert.Equal(2, result.ScenesCount);
        Assert.Equal(2, result.ScenesPreview.Count);
        Assert.Contains(result.ScenesPreview, x => x.Id == 100 && x.TopicId == 10);
        Assert.Contains(result.ScenesPreview, x => x.Id == 200 && x.TopicId == 20);
    }

    [Fact]
    public void GetAll_ReturnsAllCourses()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.AddRange(
            new Course { Id = 1, Title = "A1", Description = "D1", IsPublished = true, LanguageCode = "en" },
            new Course { Id = 2, Title = "A2", Description = "D2", IsPublished = false, LanguageCode = "en" }
        );

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var result = service.GetAll();

        Assert.Equal(2, result.Count);
        Assert.Contains(result, x => x.Id == 1 && x.Title == "A1" && x.Description == "D1" && x.IsPublished);
        Assert.Contains(result, x => x.Id == 2 && x.Title == "A2" && x.Description == "D2" && x.IsPublished == false);
    }

    [Fact]
    public void GetAll_ReturnsPublishStateForReadyAndIncompleteCourses()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.AddRange(
            new Course { Id = 1, Title = "A1", Description = "D1", IsPublished = false, LanguageCode = "en" },
            new Course { Id = 2, Title = "A2", Description = "D2", IsPublished = false, LanguageCode = "en" }
        );

        SeedValidCourseStructure(dbContext, courseId: 1);
        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var result = service.GetAll();
        var ready = result.First(x => x.Id == 1);
        var incomplete = result.First(x => x.Id == 2);

        Assert.True(ready.CanPublish);
        Assert.Equal("Курс заповнений повністю. Можна опублікувати.", ready.PublishHint);
        Assert.Empty(ready.PublishIssues);

        Assert.False(incomplete.CanPublish);
        Assert.Equal("Курс ще не готовий до публікації. Відкрий попередження, щоб побачити, чого не вистачає.", incomplete.PublishHint);
        Assert.Contains(incomplete.PublishIssues, x => x.Contains("exactly 10 topics"));
    }

    [Fact]
    public void GetById_ReturnsDetailedPublishIssuesForIncompleteCourse()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "A1",
            Description = "D1",
            IsPublished = false,
            LanguageCode = "en"
        });

        dbContext.Topics.Add(new Topic
        {
            Id = 10,
            CourseId = 1,
            Title = "Topic 1",
            Order = 1
        });

        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var result = service.GetById(1);

        Assert.False(result.CanPublish);
        Assert.NotEmpty(result.PublishIssues);
        Assert.Contains(result.PublishIssues, x => x.Contains("exactly 10 topics"));
        Assert.Contains(result.PublishIssues, x => x.Contains("exactly 8 lessons"));
        Assert.Contains(result.PublishIssues, x => x.Contains("exactly 1 final scene"));
    }

    [Fact]
    public void Create_AddsCourseAsDraft_AndReturnsResponse()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = CreateService(dbContext);

        var response = service.Create(new CreateCourseRequest
        {
            Title = "English A1",
            Description = "Desc",
            IsPublished = true,
            LanguageCode = "en"
        });

        Assert.True(response.Id > 0);
        Assert.Equal("English A1", response.Title);
        Assert.Equal("Desc", response.Description);
        Assert.False(response.IsPublished);
        Assert.False(response.CanPublish);
        Assert.Equal("Курс створено як чернетку. Публікацію можна змінити тільки у списку курсів.", response.PublishHint);
        Assert.Contains(response.PublishIssues, x => x.Contains("exactly 10 topics"));

        var saved = dbContext.Courses.FirstOrDefault(x => x.Id == response.Id);
        Assert.NotNull(saved);
        Assert.Equal("English A1", saved!.Title);
        Assert.Equal("Desc", saved.Description);
        Assert.False(saved.IsPublished);
    }

    [Fact]
    public void Create_NullRequest_Throws()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = CreateService(dbContext);

        Assert.Throws<ArgumentException>(() => service.Create(null!));
    }

    [Fact]
    public void Update_WhenNotFound_Throws()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = CreateService(dbContext);

        Assert.Throws<KeyNotFoundException>(() =>
        {
            service.Update(999, new UpdateCourseRequest
            {
                Title = "T",
                Description = "D",
                IsPublished = true,
                LanguageCode = "en"
            });
        });
    }

    [Fact]
    public void Update_UpdatesFields()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "Old",
            Description = "OldDesc",
            IsPublished = false,
            LanguageCode = "en"
        });

        SeedValidCourseStructure(dbContext, courseId: 1);

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        service.Update(1, new UpdateCourseRequest
        {
            Title = "New",
            Description = "NewDesc",
            IsPublished = true,
            LanguageCode = "en"
        });

        var updated = dbContext.Courses.First(x => x.Id == 1);

        Assert.Equal("New", updated.Title);
        Assert.Equal("NewDesc", updated.Description);
        Assert.True(updated.IsPublished);
    }

    [Fact]
    public void Update_WhenPublishingIncompleteCourse_Throws()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "Draft",
            Description = "Desc",
            IsPublished = false,
            LanguageCode = "en"
        });

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var ex = Assert.Throws<ArgumentException>(() => service.Update(1, new UpdateCourseRequest
        {
            Title = "Draft",
            Description = "Desc",
            IsPublished = true,
            LanguageCode = "en"
        }));

        Assert.Contains("exactly 10 topics", ex.Message);
    }

    [Fact]
    public void Delete_WhenNotFound_Throws()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = CreateService(dbContext);

        Assert.Throws<KeyNotFoundException>(() => service.Delete(999));
    }

    [Fact]
    public void Delete_RemovesCourse()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "ToDelete",
            Description = "D",
            IsPublished = true,
            LanguageCode = "en"
        });

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        service.Delete(1);

        Assert.Empty(dbContext.Courses);
    }

    [Fact]
    public void Delete_ClearsPrerequisiteReferences_AndRemovesCourse()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.AddRange(
            new Course
            {
                Id = 1,
                Title = "A1",
                Description = "D1",
                IsPublished = true,
                LanguageCode = "en"
            },
            new Course
            {
                Id = 2,
                Title = "A2",
                Description = "D2",
                IsPublished = false,
                LanguageCode = "en",
                PrerequisiteCourseId = 1
            });

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        service.Delete(1);

        var savedCourse = dbContext.Courses.FirstOrDefault(x => x.Id == 2);

        Assert.NotNull(savedCourse);
        Assert.Null(savedCourse!.PrerequisiteCourseId);
        Assert.DoesNotContain(dbContext.Courses, x => x.Id == 1);
    }

    private static AdminCourseService CreateService(LuminoDbContext dbContext)
    {
        var validator = new CourseStructureValidator(dbContext);
        return new AdminCourseService(dbContext, validator);
    }

    private static void SeedValidCourseStructure(LuminoDbContext dbContext, int courseId)
    {
        const int topicsPerCourse = 10;
        const int lessonsPerTopic = 8;
        const int exercisesPerLesson = 9;

        for (var topicOrder = 1; topicOrder <= topicsPerCourse; topicOrder++)
        {
            var topic = new Topic
            {
                CourseId = courseId,
                Title = $"Topic {topicOrder}",
                Order = topicOrder
            };

            dbContext.Topics.Add(topic);
            dbContext.SaveChanges();

            dbContext.Scenes.Add(new Scene
            {
                CourseId = courseId,
                TopicId = topic.Id,
                Title = $"Final scene {topicOrder}",
                Description = "Final",
                SceneType = "Sun",
                Order = 999
            });

            for (var lessonOrder = 1; lessonOrder <= lessonsPerTopic; lessonOrder++)
            {
                var lesson = new Lesson
                {
                    TopicId = topic.Id,
                    Title = $"Lesson {topicOrder}.{lessonOrder}",
                    Theory = "",
                    Order = lessonOrder
                };

                dbContext.Lessons.Add(lesson);
                dbContext.SaveChanges();

                for (var exerciseOrder = 1; exerciseOrder <= exercisesPerLesson; exerciseOrder++)
                {
                    dbContext.Exercises.Add(new Exercise
                    {
                        LessonId = lesson.Id,
                        Type = ExerciseType.Input,
                        Question = $"Q {topicOrder}.{lessonOrder}.{exerciseOrder}",
                        Data = "",
                        CorrectAnswer = "a",
                        Order = exerciseOrder
                    });
                }
            }
        }
    }
}
