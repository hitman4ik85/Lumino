using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;
using Xunit;

namespace Lumino.Tests;

public class LearningPathServiceTests
{
    [Fact]
    public void GetMyCoursePath_WhenNoResults_FirstLessonUnlocked_OthersLocked()
    {
        var dbContext = TestDbContextFactory.Create();

        SeedCourse(dbContext);

        dbContext.SaveChanges();

        var service = new LearningPathService(
            dbContext,
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var result = service.GetMyCoursePath(1, 1);

        var lessons = result.Topics.SelectMany(x => x.Lessons).OrderBy(x => x.Order).ToList();

        Assert.Equal(3, lessons.Count);

        Assert.True(lessons[0].IsUnlocked);
        Assert.False(lessons[0].IsPassed);

        Assert.False(lessons[1].IsUnlocked);
        Assert.False(lessons[2].IsUnlocked);

        var progress = dbContext.UserLessonProgresses
            .Where(x => x.UserId == 1)
            .OrderBy(x => x.LessonId)
            .ToList();

        Assert.Equal(3, progress.Count);

        Assert.True(progress[0].IsUnlocked);
        Assert.False(progress[0].IsCompleted);

        Assert.False(progress[1].IsUnlocked);
        Assert.False(progress[2].IsUnlocked);
    }


    [Fact]
    public void GetMyCoursePath_WhenProgressAlreadyTrackedLocally_ShouldNotCreateDuplicateProgress()
    {
        var dbContext = TestDbContextFactory.Create();

        SeedCourse(dbContext);

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 1,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0
        });

        dbContext.SaveChanges();

        var service = new LearningPathService(
            dbContext,
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var result = service.GetMyCoursePath(1, 1);

        var lesson1ProgressCount = dbContext.UserLessonProgresses.Local
            .Count(x => x.UserId == 1 && x.LessonId == 1);

        var totalProgressCount = dbContext.UserLessonProgresses
            .Count(x => x.UserId == 1);

        Assert.Equal(1, lesson1ProgressCount);
        Assert.Equal(3, totalProgressCount);
        Assert.True(result.Topics.SelectMany(x => x.Lessons).First(x => x.Id == 1).IsUnlocked);
    }


    [Fact]
    public void GetMyCoursePath_WhenDuplicateProgressTrackedLocally_ShouldDetachDuplicateAndKeepSingleProgress()
    {
        var dbContext = TestDbContextFactory.Create();

        SeedCourse(dbContext);
        dbContext.SaveChanges();

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 1,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0
        });

        dbContext.SaveChanges();

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 1,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = true,
            BestScore = 4
        });

        var service = new LearningPathService(
            dbContext,
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var result = service.GetMyCoursePath(1, 1);

        var lesson1ProgressCountInDb = dbContext.UserLessonProgresses
            .Count(x => x.UserId == 1 && x.LessonId == 1);

        var lesson1TrackedCount = dbContext.UserLessonProgresses.Local
            .Count(x => dbContext.Entry(x).State != Microsoft.EntityFrameworkCore.EntityState.Detached && x.UserId == 1 && x.LessonId == 1);

        var lesson1 = result.Topics.SelectMany(x => x.Lessons).First(x => x.Id == 1);

        Assert.Equal(1, lesson1ProgressCountInDb);
        Assert.Equal(1, lesson1TrackedCount);
        Assert.True(lesson1.IsUnlocked);
    }

    [Fact]
    public void GetMyCoursePath_WhenFirstLessonPassed_SecondUnlocked()
    {
        var dbContext = TestDbContextFactory.Create();

        SeedCourse(dbContext);

        dbContext.LessonResults.Add(new LessonResult
        {
            UserId = 1,
            LessonId = 1,
            Score = 4,
            TotalQuestions = 4,
            CompletedAt = new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc),
            MistakesJson = "[]"
        });

        dbContext.SaveChanges();

        var service = new LearningPathService(
            dbContext,
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var result = service.GetMyCoursePath(1, 1);

        var lessons = result.Topics.SelectMany(x => x.Lessons).OrderBy(x => x.Order).ToList();

        Assert.True(lessons[0].IsUnlocked);
        Assert.True(lessons[0].IsPassed);

        Assert.True(lessons[1].IsUnlocked);
        Assert.False(lessons[1].IsPassed);

        Assert.False(lessons[2].IsUnlocked);

        var progress = dbContext.UserLessonProgresses
            .Where(x => x.UserId == 1)
            .OrderBy(x => x.LessonId)
            .ToList();

        Assert.Equal(3, progress.Count);

        Assert.True(progress[0].IsUnlocked);
        Assert.True(progress[0].IsCompleted);

        Assert.True(progress[1].IsUnlocked);
        Assert.False(progress[1].IsCompleted);

        Assert.False(progress[2].IsUnlocked);
    }


[Fact]
public void GetMyCoursePath_WhenSceneHasTopicId_AndNotAllLessonsPassed_SceneLockedWithTopicReason()
{
    var dbContext = TestDbContextFactory.Create();

    SeedCourse(dbContext);

    dbContext.SaveChanges();

    var service = new LearningPathService(
        dbContext,
        Options.Create(new LearningSettings { PassingScorePercent = 80, SceneUnlockEveryLessons = 1 })
    );

    var result = service.GetMyCoursePath(1, 1);

    var scene = result.Scenes.First(x => x.Id == 1);

    Assert.Equal(1, scene.TopicId);
    Assert.False(scene.IsUnlocked);
    Assert.Equal("Complete the topic lessons to unlock the scene", scene.UnlockReason);
    Assert.Equal(0, scene.PassedLessons);
    Assert.Equal(3, scene.RequiredPassedLessons);
}

[Fact]
public void GetMyCoursePath_WhenSceneHasTopicId_AndAllLessonsPassed_SceneUnlocked()
{
    var dbContext = TestDbContextFactory.Create();

    SeedCourse(dbContext);

    dbContext.LessonResults.AddRange(
        new LessonResult
        {
            UserId = 1,
            LessonId = 1,
            Score = 4,
            TotalQuestions = 4,
            CompletedAt = new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc),
            MistakesJson = "[]"
        },
        new LessonResult
        {
            UserId = 1,
            LessonId = 2,
            Score = 4,
            TotalQuestions = 4,
            CompletedAt = new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc),
            MistakesJson = "[]"
        },
        new LessonResult
        {
            UserId = 1,
            LessonId = 3,
            Score = 4,
            TotalQuestions = 4,
            CompletedAt = new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc),
            MistakesJson = "[]"
        }
    );

    dbContext.SaveChanges();

    var service = new LearningPathService(
        dbContext,
        Options.Create(new LearningSettings { PassingScorePercent = 80, SceneUnlockEveryLessons = 1 })
    );

    var result = service.GetMyCoursePath(1, 1);

    var scene = result.Scenes.First(x => x.Id == 1);

    Assert.Equal(1, scene.TopicId);
    Assert.True(scene.IsUnlocked);
    Assert.Null(scene.UnlockReason);
    Assert.Equal(3, scene.PassedLessons);
    Assert.Equal(3, scene.RequiredPassedLessons);
}


[Fact]
public void GetMyCoursePath_WhenPreviousTopicSceneNotCompleted_NextTopicFirstLessonShouldStayLocked()
{
    var dbContext = TestDbContextFactory.Create();

    dbContext.Users.Add(new User
    {
        Id = 1,
        Email = "learning-path-topic-lock-1@test.local",
        PasswordHash = "hash",
        CreatedAt = new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc),
        Theme = "light"
    });

    dbContext.Courses.Add(new Course
    {
        Id = 1,
        Title = "English A1",
        Description = "Demo",
        IsPublished = true
    });

    dbContext.Topics.AddRange(
        new Topic { Id = 1, CourseId = 1, Title = "Topic 1", Order = 1 },
        new Topic { Id = 2, CourseId = 1, Title = "Topic 2", Order = 2 }
    );

    dbContext.Lessons.AddRange(
        new Lesson { Id = 1, TopicId = 1, Title = "T1 L1", Theory = "T", Order = 1 },
        new Lesson { Id = 2, TopicId = 1, Title = "T1 L2", Theory = "T", Order = 2 },
        new Lesson { Id = 3, TopicId = 2, Title = "T2 L1", Theory = "T", Order = 1 }
    );

    dbContext.Scenes.Add(new Scene
    {
        Id = 10,
        CourseId = 1,
        TopicId = 1,
        Title = "Scene 1",
        Description = "D",
        SceneType = "Dialogue",
        Order = 1
    });

    dbContext.LessonResults.AddRange(
        new LessonResult { UserId = 1, LessonId = 1, Score = 4, TotalQuestions = 4, CompletedAt = new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc), MistakesJson = "[]" },
        new LessonResult { UserId = 1, LessonId = 2, Score = 4, TotalQuestions = 4, CompletedAt = new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc), MistakesJson = "[]" }
    );

    dbContext.SaveChanges();

    var service = new LearningPathService(
        dbContext,
        Options.Create(new LearningSettings { PassingScorePercent = 80, SceneUnlockEveryLessons = 1 })
    );

    var result = service.GetMyCoursePath(1, 1);

    var topic1Lesson2 = result.Topics.First(x => x.Id == 1).Lessons.First(x => x.Id == 2);
    var topic2Lesson1 = result.Topics.First(x => x.Id == 2).Lessons.First(x => x.Id == 3);
    var scene = result.Scenes.First(x => x.Id == 10);

    Assert.True(topic1Lesson2.IsUnlocked);
    Assert.True(topic1Lesson2.IsPassed);
    Assert.False(topic2Lesson1.IsUnlocked);
    Assert.True(scene.IsUnlocked);
    Assert.Equal(10, result.NextPointers.NextSceneId);
    Assert.Null(result.NextPointers.NextLessonId);
}


[Fact]
public void GetMyCoursePath_WhenSceneHasNoTopicId_ShouldMapSceneToTopicByOrder_AndKeepNextTopicLocked()
{
    var dbContext = TestDbContextFactory.Create();

    dbContext.Users.Add(new User
    {
        Id = 1,
        Email = "learning-path-topic-lock-2@test.local",
        PasswordHash = "hash",
        CreatedAt = new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc),
        Theme = "light"
    });

    dbContext.Courses.Add(new Course
    {
        Id = 1,
        Title = "English A1",
        Description = "Demo",
        IsPublished = true
    });

    dbContext.Topics.AddRange(
        new Topic { Id = 1, CourseId = 1, Title = "Topic 1", Order = 1 },
        new Topic { Id = 2, CourseId = 1, Title = "Topic 2", Order = 2 }
    );

    dbContext.Lessons.AddRange(
        new Lesson { Id = 1, TopicId = 1, Title = "T1 L1", Theory = "T", Order = 1 },
        new Lesson { Id = 2, TopicId = 1, Title = "T1 L2", Theory = "T", Order = 2 },
        new Lesson { Id = 3, TopicId = 2, Title = "T2 L1", Theory = "T", Order = 1 }
    );

    dbContext.Scenes.Add(new Scene
    {
        Id = 10,
        Title = "Scene 1",
        Description = "D",
        SceneType = "Dialogue",
        Order = 1
    });

    dbContext.LessonResults.AddRange(
        new LessonResult { UserId = 1, LessonId = 1, Score = 4, TotalQuestions = 4, CompletedAt = new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc), MistakesJson = "[]" },
        new LessonResult { UserId = 1, LessonId = 2, Score = 4, TotalQuestions = 4, CompletedAt = new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc), MistakesJson = "[]" }
    );

    dbContext.SaveChanges();

    var service = new LearningPathService(
        dbContext,
        Options.Create(new LearningSettings { PassingScorePercent = 80, SceneUnlockEveryLessons = 1 })
    );

    var result = service.GetMyCoursePath(1, 1);

    var topic2Lesson1 = result.Topics.First(x => x.Id == 2).Lessons.First(x => x.Id == 3);
    var scene = result.Scenes.First(x => x.Id == 10);

    Assert.Equal(1, scene.TopicId);
    Assert.True(scene.IsUnlocked);
    Assert.False(topic2Lesson1.IsUnlocked);
    Assert.Equal(10, result.NextPointers.NextSceneId);
    Assert.Null(result.NextPointers.NextLessonId);
}


    [Fact]
    public void GetMyCoursePath_WhenUserDoesNotExist_ShouldThrowWithoutCreatingProgress()
    {
        var dbContext = TestDbContextFactory.Create();

        SeedCourse(dbContext, includeUser: false);
        dbContext.SaveChanges();

        var service = new LearningPathService(
            dbContext,
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        Assert.Throws<KeyNotFoundException>(() => service.GetMyCoursePath(1, 1));
        Assert.Empty(dbContext.UserLessonProgresses);
    }

    private static void SeedCourse(Lumino.Api.Data.LuminoDbContext dbContext, bool includeUser = true)
    {
        if (includeUser)
        {
            dbContext.Users.Add(new User
            {
                Id = 1,
                Email = "learning-path@test.local",
                PasswordHash = "hash",
                CreatedAt = new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc),
                Theme = "light"
            });
        }

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "English A1",
            Description = "Demo",
            IsPublished = true
        });

        dbContext.Topics.Add(new Topic
        {
            Id = 1,
            CourseId = 1,
            Title = "Basics",
            Order = 1
        });

        dbContext.Lessons.AddRange(
            new Lesson { Id = 1, TopicId = 1, Title = "L1", Theory = "T1", Order = 1 },
            new Lesson { Id = 2, TopicId = 1, Title = "L2", Theory = "T2", Order = 2 },
            new Lesson { Id = 3, TopicId = 1, Title = "L3", Theory = "T3", Order = 3 }
        );

        dbContext.Scenes.Add(new Scene
        {
            Id = 1,
            CourseId = 1,
            TopicId = 1,
            Title = "Topic Scene",
            Description = "D",
            SceneType = "Dialogue",
            Order = 1
        });
    }
}
