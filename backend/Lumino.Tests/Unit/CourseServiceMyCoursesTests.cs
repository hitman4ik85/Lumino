using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;
using Xunit;

namespace Lumino.Tests;

public class CourseServiceMyCoursesTests
{
    [Fact]
    public void GetMyCourses_UsesExplicitOrderAndPrerequisite()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.AddRange(
            new Course { Id = 1, Title = "English A1", Description = "D1", IsPublished = true, Level = "A1", Order = 1, PrerequisiteCourseId = null },
            new Course { Id = 2, Title = "English A2", Description = "D2", IsPublished = true, Level = "A2", Order = 2, PrerequisiteCourseId = 1 },
            new Course { Id = 3, Title = "English B1", Description = "D3", IsPublished = true, Level = "B1", Order = 3, PrerequisiteCourseId = 2 }
        );

        dbContext.UserCourses.Add(new UserCourse
        {
            UserId = 1,
            CourseId = 1,
            IsActive = true,
            IsCompleted = true,
            CompletedAt = DateTime.UtcNow,
            StartedAt = DateTime.UtcNow,
            LastOpenedAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var completionService = new DictCourseCompletionService(new Dictionary<int, bool>
        {
            [1] = true,
            [2] = false,
            [3] = false
        });

        var service = new CourseService(dbContext, completionService, TestLearningSettingsFactory.Create());

        var result = service.GetMyCourses(userId: 1);

        Assert.Equal(3, result.Count);

        Assert.Equal(1, result[0].Id);
        Assert.False(result[0].IsLocked);

        Assert.Equal(2, result[1].Id);
        Assert.False(result[1].IsLocked);

        Assert.Equal(3, result[2].Id);
        Assert.True(result[2].IsLocked);
    }

    [Fact]
    public void GetMyCourses_WhenCourseIsUnpublished_HidesItButKeepsProgressAfterRepublish()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "English A1",
            Description = "D1",
            IsPublished = true,
            LanguageCode = "en",
            Level = "A1",
            Order = 1
        });

        dbContext.Topics.Add(new Topic
        {
            Id = 10,
            CourseId = 1,
            Title = "Topic 1",
            Order = 1
        });

        dbContext.Lessons.Add(new Lesson
        {
            Id = 100,
            TopicId = 10,
            Title = "Lesson 1",
            Theory = "",
            Order = 1
        });

        dbContext.Exercises.AddRange(
            Enumerable.Range(1, 9).Select(order => new Exercise
            {
                Id = 1000 + order,
                LessonId = 100,
                Type = ExerciseType.Input,
                Question = $"Q{order}",
                Data = "{}",
                CorrectAnswer = "a",
                Order = order
            })
        );

        dbContext.Scenes.Add(new Scene
        {
            Id = 500,
            CourseId = 1,
            TopicId = 10,
            Title = "Sun 1",
            Description = "Scene",
            SceneType = "Sun",
            Order = 999
        });

        dbContext.UserCourses.Add(new UserCourse
        {
            UserId = 1,
            CourseId = 1,
            IsActive = true,
            IsCompleted = false,
            StartedAt = DateTime.UtcNow,
            LastOpenedAt = DateTime.UtcNow
        });

        dbContext.LessonResults.Add(new LessonResult
        {
            UserId = 1,
            LessonId = 100,
            Score = 9,
            TotalQuestions = 9,
            CompletedAt = DateTime.UtcNow
        });

        dbContext.SceneAttempts.Add(new SceneAttempt
        {
            UserId = 1,
            SceneId = 500,
            IsCompleted = true,
            CompletedAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = new CourseService(dbContext, new DictCourseCompletionService(new Dictionary<int, bool>()), TestLearningSettingsFactory.Create());

        var publishedCourses = service.GetMyCourses(userId: 1, languageCode: "en");

        Assert.Single(publishedCourses);
        Assert.Equal(100, publishedCourses[0].CompletionPercent);

        var course = dbContext.Courses.First(x => x.Id == 1);
        course.IsPublished = false;
        dbContext.SaveChanges();

        var hiddenCourses = service.GetMyCourses(userId: 1, languageCode: "en");

        Assert.Empty(hiddenCourses);
        Assert.Contains(dbContext.UserCourses, x => x.UserId == 1 && x.CourseId == 1);
        Assert.Contains(dbContext.LessonResults, x => x.UserId == 1 && x.LessonId == 100);
        Assert.Contains(dbContext.SceneAttempts, x => x.UserId == 1 && x.SceneId == 500 && x.IsCompleted);

        course.IsPublished = true;
        dbContext.SaveChanges();

        var republishedCourses = service.GetMyCourses(userId: 1, languageCode: "en");

        Assert.Single(republishedCourses);
        Assert.Equal(1, republishedCourses[0].Id);
        Assert.Equal(100, republishedCourses[0].CompletionPercent);
        Assert.True(republishedCourses[0].IsCompleted);
    }

    private class DictCourseCompletionService : ICourseCompletionService
    {
        private readonly Dictionary<int, bool> _completedMap;

        public DictCourseCompletionService(Dictionary<int, bool> completedMap)
        {
            _completedMap = completedMap;
        }

        public CourseCompletionResponse GetMyCourseCompletion(int userId, int courseId)
        {
            var isCompleted = _completedMap.TryGetValue(courseId, out var completed) && completed;

            return new CourseCompletionResponse
            {
                CourseId = courseId,
                Status = isCompleted ? "Completed" : "NotStarted",
                IsCompleted = isCompleted,
                CompletedAt = isCompleted ? DateTime.UtcNow : null,
                TotalLessons = 0,
                CompletedLessons = 0,
                CompletionPercent = isCompleted ? 100 : 0,
                NextLessonId = null,
                RemainingLessonIds = new List<int>(),
                ScenesIncluded = false,
                ScenesTotal = 0,
                ScenesCompleted = 0,
                ScenesCompletionPercent = 0
            };
        }
    }
}
