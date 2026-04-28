using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Application.Validators;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.EntityFrameworkCore;

namespace Lumino.Api.Application.Services
{
    public class AdminCourseService : IAdminCourseService
    {
        private readonly LuminoDbContext _dbContext;
        private readonly ICourseStructureValidator _courseStructureValidator;

        public AdminCourseService(LuminoDbContext dbContext, ICourseStructureValidator courseStructureValidator)
        {
            _dbContext = dbContext;
            _courseStructureValidator = courseStructureValidator;
        }

        public List<AdminCourseResponse> GetAll()
        {
            var courses = _dbContext.Courses
                .ToList();

            return courses
                .Select(x =>
                {
                    var publishState = GetPublishState(x.Id, x.IsPublished);

                    return new AdminCourseResponse
                    {
                        Id = x.Id,
                        Title = x.Title,
                        Description = x.Description,
                        LanguageCode = x.LanguageCode,
                        IsPublished = x.IsPublished,
                        Level = x.Level,
                        Order = x.Order,
                        PrerequisiteCourseId = x.PrerequisiteCourseId,
                        CanPublish = publishState.CanPublish,
                        PublishHint = publishState.PublishHint,
                        PublishIssues = publishState.PublishIssues
                    };
                })
                .ToList();
        }

        public AdminCourseDetailsResponse GetById(int id)
        {
            var course = _dbContext.Courses.FirstOrDefault(x => x.Id == id);

            if (course == null)
            {
                throw new KeyNotFoundException("Course not found");
            }

            var topics = _dbContext.Topics
                .Where(x => x.CourseId == id)
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .Select(x => new AdminTopicResponse
                {
                    Id = x.Id,
                    CourseId = x.CourseId,
                    Title = x.Title,
                    Order = x.Order
                })
                .ToList();

            var topicIds = topics.Select(x => x.Id).ToList();

            var lessonsCount = _dbContext.Lessons.Count(x => topicIds.Contains(x.TopicId));

            var lessonIds = _dbContext.Lessons
                .Where(x => topicIds.Contains(x.TopicId))
                .Select(x => x.Id)
                .ToList();

            var exercisesCount = _dbContext.Exercises.Count(x => lessonIds.Contains(x.LessonId));

            var orderedTopicIds = topics
                .Select(x => x.Id)
                .ToList();

            var courseScenes = _dbContext.Scenes
                .Where(x => x.CourseId == id)
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            var scenesCount = courseScenes.Count;

            var scenesPreview = courseScenes
                .Select((x, index) => new AdminSceneResponse
                {
                    Id = x.Id,
                    CourseId = x.CourseId,
                    TopicId = x.TopicId ?? (index < orderedTopicIds.Count ? orderedTopicIds[index] : null),
                    Title = x.Title,
                    Description = x.Description,
                    SceneType = x.SceneType,
                    BackgroundUrl = x.BackgroundUrl,
                    AudioUrl = x.AudioUrl,
                    Order = x.Order
                })
                .ToList();

            var publishState = GetPublishState(course.Id, course.IsPublished);

            return new AdminCourseDetailsResponse
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                LanguageCode = course.LanguageCode,
                IsPublished = course.IsPublished,
                Level = course.Level,
                Order = course.Order,
                PrerequisiteCourseId = course.PrerequisiteCourseId,
                CanPublish = publishState.CanPublish,
                PublishHint = publishState.PublishHint,
                PublishIssues = publishState.PublishIssues,
                TopicsCount = topics.Count,
                LessonsCount = lessonsCount,
                ExercisesCount = exercisesCount,
                ScenesCount = scenesCount,
                Topics = topics,
                ScenesPreview = scenesPreview
            };
        }

        public AdminCourseResponse Create(CreateCourseRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var languageCode = string.IsNullOrWhiteSpace(request.LanguageCode)
                ? "en"
                : request.LanguageCode.Trim().ToLowerInvariant();

            if (!SupportedLanguages.IsLearnable(languageCode))
            {
                throw new ArgumentException("LanguageCode is not supported");
            }

            var course = new Course
            {
                Title = request.Title,
                Description = request.Description,
                LanguageCode = languageCode,
                Level = string.IsNullOrWhiteSpace(request.Level)
                    ? null
                    : request.Level.Trim().ToUpperInvariant(),
                Order = request.Order,
                PrerequisiteCourseId = request.PrerequisiteCourseId,
                IsPublished = false
            };

            _dbContext.Courses.Add(course);
            _dbContext.SaveChanges();

            return new AdminCourseResponse
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                LanguageCode = course.LanguageCode,
                IsPublished = course.IsPublished,
                Level = course.Level,
                Order = course.Order,
                PrerequisiteCourseId = course.PrerequisiteCourseId,
                CanPublish = false,
                PublishHint = "Курс створено як чернетку. Публікацію можна змінити тільки у списку курсів.",
                PublishIssues = GetPublishIssues(course.Id)
            };
        }

        public void Update(int id, UpdateCourseRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var course = _dbContext.Courses.FirstOrDefault(x => x.Id == id);

            if (course == null)
            {
                throw new KeyNotFoundException("Course not found");
            }

            var languageCode = string.IsNullOrWhiteSpace(request.LanguageCode)
                ? "en"
                : request.LanguageCode.Trim().ToLowerInvariant();

            if (!SupportedLanguages.IsLearnable(languageCode))
            {
                throw new ArgumentException("LanguageCode is not supported");
            }

            if (request.IsPublished)
            {
                _courseStructureValidator.ValidateOrThrow(course.Id);
            }

            course.Title = request.Title;
            course.Description = request.Description;
            course.LanguageCode = languageCode;
            course.Level = string.IsNullOrWhiteSpace(request.Level)
                ? null
                : request.Level.Trim().ToUpperInvariant();
            course.Order = request.Order;
            course.PrerequisiteCourseId = request.PrerequisiteCourseId;
            course.IsPublished = request.IsPublished;

            _dbContext.SaveChanges();
        }

        private PublishStateResult GetPublishState(int courseId, bool isPublished)
        {
            var publishIssues = GetPublishIssues(courseId);

            if (publishIssues.Count == 0)
            {
                if (isPublished)
                {
                    return new PublishStateResult
                    {
                        CanPublish = true,
                        PublishHint = "Курс опублікований. Зніми галочку, щоб прибрати його з проходження.",
                        PublishIssues = publishIssues
                    };
                }

                return new PublishStateResult
                {
                    CanPublish = true,
                    PublishHint = "Курс заповнений повністю. Можна опублікувати.",
                    PublishIssues = publishIssues
                };
            }

            if (isPublished)
            {
                return new PublishStateResult
                {
                    CanPublish = false,
                    PublishHint = "Курс опублікований, але зараз структура неповна. Прогрес користувачів не видаляється, але курс краще зняти з публікації до виправлення.",
                    PublishIssues = publishIssues
                };
            }

            return new PublishStateResult
            {
                CanPublish = false,
                PublishHint = "Курс ще не готовий до публікації. Відкрий попередження, щоб побачити, чого не вистачає.",
                PublishIssues = publishIssues
            };
        }

        private List<string> GetPublishIssues(int courseId)
        {
            var issues = new List<string>();

            var course = _dbContext.Courses
                .AsNoTracking()
                .FirstOrDefault(x => x.Id == courseId);

            if (course == null)
            {
                issues.Add("Course not found");
                return issues;
            }

            var topics = _dbContext.Topics
                .AsNoTracking()
                .Where(x => x.CourseId == courseId)
                .OrderBy(x => x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            if (topics.Count != CourseStructureLimits.TopicsPerCourse)
            {
                issues.Add($"Course must have exactly {CourseStructureLimits.TopicsPerCourse} topics, but found {topics.Count}.");
            }

            if (topics.Count > 0)
            {
                var topicOrders = topics
                    .Select(x => x.Order)
                    .ToList();

                if (topicOrders.Distinct().Count() != topics.Count || topicOrders.Min() != 1 || topicOrders.Max() != topics.Count)
                {
                    issues.Add($"Topics order must stay unique and continuous from 1 to {Math.Max(topics.Count, 1)}.");
                }
            }

            foreach (var topic in topics)
            {
                var lessons = _dbContext.Lessons
                    .AsNoTracking()
                    .Where(x => x.TopicId == topic.Id)
                    .OrderBy(x => x.Order)
                    .ThenBy(x => x.Id)
                    .ToList();

                if (lessons.Count != CourseStructureLimits.LessonsPerTopic)
                {
                    issues.Add($"Topic #{topic.Order} must have exactly {CourseStructureLimits.LessonsPerTopic} lessons, but found {lessons.Count}.");
                }

                if (lessons.Count > 0)
                {
                    var lessonOrders = lessons
                        .Select(x => x.Order)
                        .ToList();

                    if (lessonOrders.Distinct().Count() != lessons.Count || lessonOrders.Min() != 1 || lessonOrders.Max() != lessons.Count)
                    {
                        issues.Add($"Lessons order in topic #{topic.Order} must stay unique and continuous from 1 to {Math.Max(lessons.Count, 1)}.");
                    }
                }

                var finalScenesCount = _dbContext.Scenes
                    .AsNoTracking()
                    .Count(x => x.TopicId == topic.Id && x.SceneType == CourseStructureLimits.FinalSceneType);

                if (finalScenesCount != 1)
                {
                    issues.Add($"Topic #{topic.Order} must have exactly 1 final scene with SceneType='{CourseStructureLimits.FinalSceneType}', but found {finalScenesCount}.");
                }

                foreach (var lesson in lessons)
                {
                    var exercises = _dbContext.Exercises
                        .AsNoTracking()
                        .Where(x => x.LessonId == lesson.Id)
                        .OrderBy(x => x.Order)
                        .ThenBy(x => x.Id)
                        .ToList();

                    if (exercises.Count != CourseStructureLimits.ExercisesPerLesson)
                    {
                        issues.Add($"Lesson #{lesson.Order} in topic #{topic.Order} must have exactly {CourseStructureLimits.ExercisesPerLesson} exercises, but found {exercises.Count}.");
                    }

                    if (exercises.Count > 0)
                    {
                        var exerciseOrders = exercises
                            .Select(x => x.Order)
                            .ToList();

                        if (exerciseOrders.Distinct().Count() != exercises.Count || exerciseOrders.Min() != 1 || exerciseOrders.Max() != exercises.Count)
                        {
                            issues.Add($"Exercises order in lesson #{lesson.Order} (topic #{topic.Order}) must stay unique and continuous from 1 to {Math.Max(exercises.Count, 1)}.");
                        }
                    }
                }
            }

            return issues;
        }

        public void Delete(int id)
        {
            var course = _dbContext.Courses.FirstOrDefault(x => x.Id == id);

            if (course == null)
            {
                throw new KeyNotFoundException("Course not found");
            }

            var dependentCourses = _dbContext.Courses
                .Where(x => x.PrerequisiteCourseId == id)
                .ToList();

            foreach (var dependentCourse in dependentCourses)
            {
                dependentCourse.PrerequisiteCourseId = null;
            }

            _dbContext.Courses.Remove(course);
            _dbContext.SaveChanges();
        }

        private sealed class PublishStateResult
        {
            public bool CanPublish { get; set; }

            public string PublishHint { get; set; } = string.Empty;

            public List<string> PublishIssues { get; set; } = new();
        }
    }
}
