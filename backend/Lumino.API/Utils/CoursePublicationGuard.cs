using Lumino.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Lumino.Api.Utils
{
    public static class CoursePublicationGuard
    {
        public static void UnpublishIfStructureIncomplete(LuminoDbContext dbContext, params int?[] courseIds)
        {
            if (dbContext == null)
            {
                throw new ArgumentNullException(nameof(dbContext));
            }

            var normalizedCourseIds = (courseIds ?? Array.Empty<int?>())
                .Where(x => x.HasValue && x.Value > 0)
                .Select(x => x!.Value)
                .Distinct()
                .ToList();

            if (normalizedCourseIds.Count == 0)
            {
                return;
            }

            var publishedCourses = dbContext.Courses
                .Where(x => normalizedCourseIds.Contains(x.Id) && x.IsPublished)
                .ToList();

            if (publishedCourses.Count == 0)
            {
                return;
            }

            var hasChanges = false;

            foreach (var course in publishedCourses)
            {
                if (IsStructureComplete(dbContext, course.Id))
                {
                    continue;
                }

                course.IsPublished = false;
                hasChanges = true;
            }

            if (hasChanges)
            {
                dbContext.SaveChanges();
            }
        }

        private static bool IsStructureComplete(LuminoDbContext dbContext, int courseId)
        {
            var courseExists = dbContext.Courses
                .AsNoTracking()
                .Any(x => x.Id == courseId);

            if (!courseExists)
            {
                return false;
            }

            var topics = dbContext.Topics
                .AsNoTracking()
                .Where(x => x.CourseId == courseId)
                .OrderBy(x => x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            if (topics.Count != CourseStructureLimits.TopicsPerCourse)
            {
                return false;
            }

            var topicOrders = topics
                .Select(x => x.Order)
                .ToList();

            if (topicOrders.Distinct().Count() != CourseStructureLimits.TopicsPerCourse || topicOrders.Min() != 1 || topicOrders.Max() != CourseStructureLimits.TopicsPerCourse)
            {
                return false;
            }

            foreach (var topic in topics)
            {
                var lessons = dbContext.Lessons
                    .AsNoTracking()
                    .Where(x => x.TopicId == topic.Id)
                    .OrderBy(x => x.Order)
                    .ThenBy(x => x.Id)
                    .ToList();

                if (lessons.Count != CourseStructureLimits.LessonsPerTopic)
                {
                    return false;
                }

                var lessonOrders = lessons
                    .Select(x => x.Order)
                    .ToList();

                if (lessonOrders.Distinct().Count() != CourseStructureLimits.LessonsPerTopic || lessonOrders.Min() != 1 || lessonOrders.Max() != CourseStructureLimits.LessonsPerTopic)
                {
                    return false;
                }

                var finalScenesCount = dbContext.Scenes
                    .AsNoTracking()
                    .Count(x => x.TopicId == topic.Id && x.SceneType == CourseStructureLimits.FinalSceneType);

                if (finalScenesCount != 1)
                {
                    return false;
                }

                foreach (var lesson in lessons)
                {
                    var exercises = dbContext.Exercises
                        .AsNoTracking()
                        .Where(x => x.LessonId == lesson.Id)
                        .OrderBy(x => x.Order)
                        .ThenBy(x => x.Id)
                        .ToList();

                    if (exercises.Count != CourseStructureLimits.ExercisesPerLesson)
                    {
                        return false;
                    }

                    var exerciseOrders = exercises
                        .Select(x => x.Order)
                        .ToList();

                    if (exerciseOrders.Distinct().Count() != CourseStructureLimits.ExercisesPerLesson || exerciseOrders.Min() != 1 || exerciseOrders.Max() != CourseStructureLimits.ExercisesPerLesson)
                    {
                        return false;
                    }
                }
            }

            return true;
        }
    }
}
