using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Utils;
using Microsoft.EntityFrameworkCore;

namespace Lumino.Api.Application.Services
{
    public class CourseService : ICourseService
    {
        private readonly LuminoDbContext _dbContext;
        private readonly ICourseCompletionService _courseCompletionService;
        private readonly LearningSettings _learningSettings;

        public CourseService(LuminoDbContext dbContext, ICourseCompletionService courseCompletionService, Microsoft.Extensions.Options.IOptions<LearningSettings> learningSettings)
        {
            _dbContext = dbContext;
            _courseCompletionService = courseCompletionService;
            _learningSettings = learningSettings.Value;
        }

        public List<CourseResponse> GetPublishedCourses(string? languageCode = null)
        {
            var query = _dbContext.Courses
                .Where(x => x.IsPublished);

            if (!string.IsNullOrWhiteSpace(languageCode))
            {
                if (!Lumino.Api.Utils.SupportedLanguages.IsLearnable(languageCode))
                {
                    throw new ArgumentException("LanguageCode is not supported");
                }

                var normalized = languageCode.Trim().ToLowerInvariant();
                query = query.Where(x => x.LanguageCode == normalized);
            }

            return query
                .Select(x => new CourseResponse
                {
                    Id = x.Id,
                    Title = x.Title,
                    Description = x.Description,
                    LanguageCode = x.LanguageCode,
                    Level = x.Level,
                    Order = x.Order,
                    PrerequisiteCourseId = x.PrerequisiteCourseId
                })
                .ToList();
        }


        public List<CourseForMeResponse> GetMyCourses(int userId, string? languageCode = null)
        {
            var query = _dbContext.Courses
                .AsNoTracking()
                .Where(x => x.IsPublished);

            if (!string.IsNullOrWhiteSpace(languageCode))
            {
                if (!SupportedLanguages.IsLearnable(languageCode))
                {
                    throw new ArgumentException("LanguageCode is not supported");
                }

                var normalized = languageCode.Trim().ToLowerInvariant();
                query = query.Where(x => x.LanguageCode == normalized);
            }

            var courses = query
                .ToList()
                .OrderBy(x => GetCourseOrder(x))
                .ThenBy(x => x.Id)
                .ToList();

            if (courses.Count == 0)
            {
                return new List<CourseForMeResponse>();
            }

            var courseIds = courses.Select(x => x.Id).ToList();
            int passingScorePercent = LessonPassingRules.NormalizePassingPercent(_learningSettings.PassingScorePercent);

            var lessonRows =
                (from t in _dbContext.Topics.AsNoTracking()
                 join l in _dbContext.Lessons.AsNoTracking() on t.Id equals l.TopicId
                 where courseIds.Contains(t.CourseId)
                 select new { t.CourseId, LessonId = l.Id })
                .ToList();

            var lessonIdsByCourse = lessonRows
                .GroupBy(x => x.CourseId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.LessonId).Distinct().ToList());

            var allLessonIds = lessonRows
                .Select(x => x.LessonId)
                .Distinct()
                .ToList();

            var passedLessonIds = allLessonIds.Count == 0
                ? new HashSet<int>()
                : _dbContext.LessonResults
                    .AsNoTracking()
                    .Where(x =>
                        x.UserId == userId &&
                        allLessonIds.Contains(x.LessonId) &&
                        x.TotalQuestions > 0 &&
                        x.Score * 100 >= x.TotalQuestions * passingScorePercent)
                    .Select(x => x.LessonId)
                    .Distinct()
                    .ToHashSet();

            var sceneRows = _dbContext.Scenes
                .AsNoTracking()
                .Where(x => x.CourseId.HasValue && courseIds.Contains(x.CourseId.Value))
                .Select(x => new { CourseId = x.CourseId!.Value, SceneId = x.Id })
                .ToList();

            var sceneIdsByCourse = sceneRows
                .GroupBy(x => x.CourseId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.SceneId).Distinct().ToList());

            var allSceneIds = sceneRows
                .Select(x => x.SceneId)
                .Distinct()
                .ToList();

            var completedSceneIds = allSceneIds.Count == 0
                ? new HashSet<int>()
                : _dbContext.SceneAttempts
                    .AsNoTracking()
                    .Where(x => x.UserId == userId && x.IsCompleted && allSceneIds.Contains(x.SceneId))
                    .Select(x => x.SceneId)
                    .Distinct()
                    .ToHashSet();

            var userCourseMap = _dbContext.UserCourses
                .AsNoTracking()
                .Where(x => x.UserId == userId && courseIds.Contains(x.CourseId))
                .ToDictionary(x => x.CourseId, x => x);

            var completionMap = new Dictionary<int, CourseCompletionResponse>();

            foreach (var c in courses)
            {
                var lessonIds = lessonIdsByCourse.TryGetValue(c.Id, out var courseLessonIds) ? courseLessonIds : new List<int>();
                var completedLessons = lessonIds.Count == 0 ? 0 : lessonIds.Count(x => passedLessonIds.Contains(x));
                var totalLessons = lessonIds.Count;

                var sceneIds = sceneIdsByCourse.TryGetValue(c.Id, out var courseSceneIds) ? courseSceneIds : new List<int>();
                var scenesTotal = sceneIds.Count;
                var scenesCompleted = scenesTotal == 0 ? 0 : sceneIds.Count(x => completedSceneIds.Contains(x));
                var scenesIncluded = scenesTotal > 0;

                var totalSteps = totalLessons * 9 + scenesTotal;
                var completedSteps = completedLessons * 9 + scenesCompleted;
                var completionPercent = totalSteps <= 0 ? 0 : (int)Math.Round((double)completedSteps * 100 / totalSteps);

                if (completionPercent > 100)
                {
                    completionPercent = 100;
                }

                userCourseMap.TryGetValue(c.Id, out var userCourse);

                var isCompleted = userCourse != null && userCourse.IsCompleted;

                if (!isCompleted && totalLessons > 0 && completedLessons >= totalLessons && (!scenesIncluded || scenesCompleted >= scenesTotal))
                {
                    isCompleted = true;
                    completionPercent = 100;
                }

                completionMap[c.Id] = new CourseCompletionResponse
                {
                    CourseId = c.Id,
                    Status = isCompleted ? "Completed" : (completedLessons > 0 || scenesCompleted > 0 || userCourse != null ? "InProgress" : "NotStarted"),
                    IsCompleted = isCompleted,
                    CompletedAt = userCourse?.CompletedAt,
                    TotalLessons = totalLessons,
                    CompletedLessons = completedLessons,
                    CompletionPercent = completionPercent,
                    NextLessonId = lessonIds.FirstOrDefault(x => !passedLessonIds.Contains(x)),
                    RemainingLessonIds = lessonIds.Where(x => !passedLessonIds.Contains(x)).ToList(),
                    ScenesIncluded = scenesIncluded,
                    ScenesTotal = scenesTotal,
                    ScenesCompleted = scenesCompleted,
                    ScenesCompletionPercent = scenesTotal <= 0 ? 0 : (int)Math.Round((double)scenesCompleted * 100 / scenesTotal)
                };
            }

            var inferredPrerequisiteMap = new Dictionary<int, int>();

            foreach (var group in courses.GroupBy(x => x.LanguageCode))
            {
                var ordered = group
                    .OrderBy(x => GetCourseOrder(x))
                    .ThenBy(x => x.Id)
                    .ToList();

                for (var i = 1; i < ordered.Count; i++)
                {
                    var current = ordered[i];

                    if (current.PrerequisiteCourseId == null)
                    {
                        inferredPrerequisiteMap[current.Id] = ordered[i - 1].Id;
                    }
                }
            }

            var result = new List<CourseForMeResponse>();

            foreach (var c in courses)
            {
                var completion = completionMap[c.Id];
                var isLocked = IsCourseLockedByPrerequisiteId(GetEffectivePrerequisiteCourseId(c, inferredPrerequisiteMap), completionMap);
                var level = GetCourseLevel(c);

                result.Add(new CourseForMeResponse
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    LanguageCode = c.LanguageCode,
                    Level = level,
                    Order = c.Order,
                    PrerequisiteCourseId = c.PrerequisiteCourseId,
                    IsLocked = isLocked,
                    IsCompleted = completion.IsCompleted,
                    CompletionPercent = completion.CompletionPercent
                });
            }

            return result;
        }


        private static bool IsCourseLocked(Lumino.Api.Domain.Entities.Course course, Dictionary<int, CourseCompletionResponse> completionMap)
        {
            return IsCourseLockedByPrerequisiteId(course.PrerequisiteCourseId, completionMap);
        }


        private static int? GetEffectivePrerequisiteCourseId(Lumino.Api.Domain.Entities.Course course, Dictionary<int, int> inferredPrerequisiteMap)
        {
            if (course.PrerequisiteCourseId != null)
            {
                return course.PrerequisiteCourseId;
            }

            if (inferredPrerequisiteMap.TryGetValue(course.Id, out var inferred))
            {
                return inferred;
            }

            return null;
        }


        private static bool IsCourseLockedByPrerequisiteId(int? prerequisiteCourseId, Dictionary<int, CourseCompletionResponse> completionMap)
        {
            if (prerequisiteCourseId == null)
            {
                return false;
            }

            if (!completionMap.TryGetValue(prerequisiteCourseId.Value, out var prerequisiteCompletion))
            {
                return false;
            }

            return !prerequisiteCompletion.IsCompleted;
        }

        private static string? GetCourseLevel(Lumino.Api.Domain.Entities.Course course)
        {
            if (!string.IsNullOrWhiteSpace(course.Level))
            {
                return course.Level!.Trim().ToUpperInvariant();
            }

            return TryExtractLevel(course.Title);
        }


        private static int GetCourseOrder(Lumino.Api.Domain.Entities.Course course)
        {
            if (course.Order > 0)
            {
                return course.Order;
            }

            var level = GetCourseLevel(course);

            if (string.IsNullOrWhiteSpace(level))
            {
                return 1000;
            }

            return level switch
            {
                "A1" => 1,
                "A2" => 2,
                "B1" => 3,
                "B2" => 4,
                "C1" => 5,
                "C2" => 6,
                _ => 1000
            };
        }

        private static string? TryExtractLevel(string title)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                return null;
            }

            var t = title.ToUpperInvariant();

            // Most common patterns: "English A1", "A1 English", "EN-A1"
            var match = System.Text.RegularExpressions.Regex.Match(t, @"\b([ABC])\s*([12])\b");

            if (!match.Success)
            {
                match = System.Text.RegularExpressions.Regex.Match(t, @"\b([ABC])([12])\b");
            }

            if (!match.Success)
            {
                return null;
            }

            return match.Groups[1].Value + match.Groups[2].Value;
        }

    }
}
