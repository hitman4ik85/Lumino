using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.EntityFrameworkCore;

namespace Lumino.Api.Application.Services
{
    public class LearningPathService : ILearningPathService
    {
        private readonly LuminoDbContext _dbContext;
        private readonly LearningSettings _learningSettings;

        public LearningPathService(
            LuminoDbContext dbContext,
            Microsoft.Extensions.Options.IOptions<LearningSettings> learningSettings)
        {
            _dbContext = dbContext;
            _learningSettings = learningSettings.Value;
        }

        public LearningPathResponse GetMyCoursePath(int userId, int courseId)
        {
            var course = _dbContext.Courses
                .AsNoTracking()
                .FirstOrDefault(x => x.Id == courseId && x.IsPublished);

            if (course == null)
            {
                throw new KeyNotFoundException("Course not found");
            }

            int passingScorePercent = LessonPassingRules.NormalizePassingPercent(_learningSettings.PassingScorePercent);

            var orderedLessons =
                (from t in _dbContext.Topics.AsNoTracking()
                 join l in _dbContext.Lessons.AsNoTracking() on t.Id equals l.TopicId
                 where t.CourseId == course.Id
                 orderby (t.Order <= 0 ? int.MaxValue : t.Order), t.Id, (l.Order <= 0 ? int.MaxValue : l.Order), l.Id
                 select new OrderedLessonInfo
                 {
                     TopicId = t.Id,
                     TopicTitle = t.Title,
                     TopicOrder = t.Order,
                     LessonId = l.Id,
                     LessonTitle = l.Title,
                     LessonOrder = l.Order
                 })
                .ToList();

            var lessonIds = orderedLessons.Select(x => x.LessonId).Distinct().ToList();
            var topicIds = orderedLessons.Select(x => x.TopicId).Distinct().ToList();

            var bestResults = _dbContext.LessonResults
                .AsNoTracking()
                .Where(x => x.UserId == userId && lessonIds.Contains(x.LessonId))
                .GroupBy(x => x.LessonId)
                .Select(g => new BestLessonResult
                {
                    LessonId = g.Key,
                    BestScore = g.Max(x => x.Score),
                    TotalQuestions = g.Max(x => x.TotalQuestions)
                })
                .ToDictionary(x => x.LessonId, x => x);

            var topicOrderIds = orderedLessons
                .GroupBy(x => new { x.TopicId, x.TopicOrder })
                .OrderBy(x => x.Key.TopicOrder <= 0 ? int.MaxValue : x.Key.TopicOrder)
                .ThenBy(x => x.Key.TopicId)
                .Select(x => x.Key.TopicId)
                .ToList();

            var orderedScenes = _dbContext.Scenes
                .AsNoTracking()
                .Where(x => x.CourseId == course.Id || x.CourseId == null)
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            var effectiveTopicIdBySceneId = BuildEffectiveTopicIdBySceneId(orderedScenes, topicOrderIds);

            var completedSceneTopicIds = _dbContext.SceneAttempts
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.IsCompleted)
                .Select(x => x.SceneId)
                .ToList()
                .Where(x => effectiveTopicIdBySceneId.ContainsKey(x))
                .Select(x => effectiveTopicIdBySceneId[x])
                .Distinct()
                .ToHashSet();

            var topicIdsWithScenes = effectiveTopicIdBySceneId
                .Values
                .Distinct()
                .ToHashSet();

            EnsureUserLessonProgressIsInSync(userId, orderedLessons, bestResults, passingScorePercent, completedSceneTopicIds, topicIdsWithScenes);

            var progressDict = _dbContext.UserLessonProgresses
                .AsNoTracking()
                .Where(x => x.UserId == userId && lessonIds.Contains(x.LessonId))
                .ToList()
                .GroupBy(x => x.LessonId)
                .ToDictionary(x => x.Key, x => SelectPrimaryProgress(x));

            var passedTopicStats = orderedLessons
                .GroupBy(x => new { x.TopicId, x.TopicTitle, x.TopicOrder })
                .ToDictionary(
                    g => g.Key.TopicId,
                    g => new TopicLessonStats
                    {
                        TotalLessons = g.Select(x => x.LessonId).Distinct().Count(),
                        PassedLessons = g.Count(x => progressDict.TryGetValue(x.LessonId, out var p) && p.IsCompleted)
                    });

            var topics = orderedLessons
                .GroupBy(x => new { x.TopicId, x.TopicTitle, x.TopicOrder })
                .OrderBy(x => x.Key.TopicOrder <= 0 ? int.MaxValue : x.Key.TopicOrder)
                .ThenBy(x => x.Key.TopicId)
                .Select(g => new LearningPathTopicResponse
                {
                    Id = g.Key.TopicId,
                    Title = g.Key.TopicTitle,
                    Order = g.Key.TopicOrder,
                    Lessons = g
                        .OrderBy(x => x.LessonOrder <= 0 ? int.MaxValue : x.LessonOrder)
                        .ThenBy(x => x.LessonId)
                        .Select(x =>
                        {
                            progressDict.TryGetValue(x.LessonId, out var p);

                            int? totalQuestions = null;
                            int? bestPercent = null;

                            if (bestResults.TryGetValue(x.LessonId, out var best))
                            {
                                totalQuestions = best.TotalQuestions;

                                if (totalQuestions.HasValue && totalQuestions.Value > 0)
                                {
                                    var scoreForPercent = p != null ? p.BestScore : best.BestScore;
                                    bestPercent = (int)Math.Round(scoreForPercent * 100.0 / totalQuestions.Value);
                                }
                            }

                            return new LearningPathLessonResponse
                            {
                                Id = x.LessonId,
                                Title = x.LessonTitle,
                                Order = x.LessonOrder,
                                IsUnlocked = p != null && p.IsUnlocked,
                                IsPassed = p != null && p.IsCompleted,
                                BestScore = p != null ? p.BestScore : null,
                                TotalQuestions = totalQuestions,
                                BestPercent = bestPercent
                            };
                        })
                        .ToList()
                })
                .ToList();

            var passedLessons = progressDict
                .Where(x => lessonIds.Contains(x.Key))
                .Count(x => x.Value.IsCompleted);

            var unlockEvery = SceneUnlockRules.NormalizeUnlockEveryLessons(_learningSettings.SceneUnlockEveryLessons);

            var completedSceneIds = _dbContext.SceneAttempts
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.IsCompleted)
                .Select(x => x.SceneId)
                .Distinct()
                .ToHashSet();

            var courseScopedScenes = orderedScenes.Where(x => x.CourseId == course.Id).ToList();
            var scenesForPath = courseScopedScenes.Count > 0
                ? courseScopedScenes
                : orderedScenes.Where(x => x.CourseId == null).ToList();

            var scenes = new List<LearningPathSceneResponse>();

            for (int i = 0; i < scenesForPath.Count; i++)
            {
                var s = scenesForPath[i];

                var effectiveTopicId = effectiveTopicIdBySceneId.ContainsKey(s.Id)
                    ? (int?)effectiveTopicIdBySceneId[s.Id]
                    : s.TopicId;

                int scenePosition = i + 1;

                int required;
                int passed;
                bool isUnlocked;
                string? unlockReason;

                if (effectiveTopicId.HasValue && passedTopicStats.TryGetValue(effectiveTopicId.Value, out var stats))
                {
                    required = stats.TotalLessons;
                    passed = stats.PassedLessons;
                    isUnlocked = passed >= required;
                    unlockReason = isUnlocked ? null : "Complete the topic lessons to unlock the scene";
                }
                else if (effectiveTopicId.HasValue)
                {
                    required = 0;
                    passed = 0;
                    isUnlocked = true;
                    unlockReason = null;
                }
                else
                {
                    required = SceneUnlockRules.GetRequiredPassedLessons(scenePosition, unlockEvery);
                    passed = passedLessons;
                    isUnlocked = SceneUnlockRules.IsUnlocked(scenePosition, passedLessons, unlockEvery);
                    unlockReason = isUnlocked ? null : $"Pass {required} lessons to unlock";
                }

                scenes.Add(new LearningPathSceneResponse
                {
                    Id = s.Id,
                    CourseId = s.CourseId,
                    TopicId = effectiveTopicId,
                    Order = s.Order,
                    Title = s.Title,
                    Description = s.Description,
                    SceneType = s.SceneType,
                    IsCompleted = completedSceneIds.Contains(s.Id),
                    IsUnlocked = isUnlocked,
                    UnlockReason = unlockReason,
                    PassedLessons = passed,
                    RequiredPassedLessons = required
                });
            }

            int? nextLessonId = null;

            for (int i = 0; i < orderedLessons.Count; i++)
            {
                var l = orderedLessons[i];

                progressDict.TryGetValue(l.LessonId, out var p);

                if (p != null && p.IsUnlocked && !p.IsCompleted)
                {
                    nextLessonId = l.LessonId;
                    break;
                }
            }

            int? nextSceneId = null;

            for (int i = 0; i < scenes.Count; i++)
            {
                var s = scenes[i];

                if (s.IsUnlocked && !s.IsCompleted)
                {
                    nextSceneId = s.Id;
                    break;
                }
            }

            var nextPointers = new LearningPathNextPointersResponse
            {
                NextLessonId = nextLessonId,
                NextSceneId = nextSceneId
            };

            return new LearningPathResponse
            {
                CourseId = course.Id,
                CourseTitle = course.Title,
                Topics = topics,
                Scenes = scenes,
                NextPointers = nextPointers
            };
        }

        private class TopicLessonStats
        {
            public int TotalLessons { get; set; }

            public int PassedLessons { get; set; }
        }

        private void EnsureUserLessonProgressIsInSync(
            int userId,
            List<OrderedLessonInfo> orderedLessons,
            Dictionary<int, BestLessonResult> bestResults,
            int passingScorePercent,
            HashSet<int> completedSceneTopicIds,
            HashSet<int> topicIdsWithScenes)
        {
            if (orderedLessons == null || orderedLessons.Count == 0)
            {
                return;
            }

            var lessonIds = orderedLessons.Select(x => x.LessonId).Distinct().ToList();

            bool needSave = false;
            var existing = new Dictionary<int, UserLessonProgress>();

            var existingProgressGroups = _dbContext.UserLessonProgresses
                .Where(x => x.UserId == userId && lessonIds.Contains(x.LessonId))
                .ToList()
                .GroupBy(x => x.LessonId)
                .ToList();

            foreach (var existingGroup in existingProgressGroups)
            {
                var primaryProgress = SelectPrimaryProgress(existingGroup);

                foreach (var duplicateProgress in existingGroup)
                {
                    if (ReferenceEquals(primaryProgress, duplicateProgress))
                    {
                        continue;
                    }

                    if (MergeProgress(primaryProgress, duplicateProgress))
                    {
                        needSave = true;
                    }

                    _dbContext.UserLessonProgresses.Remove(duplicateProgress);
                    needSave = true;
                }

                existing[existingGroup.Key] = primaryProgress;
            }

            var trackedProgressGroups = _dbContext.UserLessonProgresses.Local
                .Where(x => _dbContext.Entry(x).State != EntityState.Deleted && x.UserId == userId && lessonIds.Contains(x.LessonId))
                .GroupBy(x => x.LessonId)
                .ToList();

            foreach (var trackedGroup in trackedProgressGroups)
            {
                UserLessonProgress trackedProgress;

                if (existing.TryGetValue(trackedGroup.Key, out var existingProgress))
                {
                    trackedProgress = existingProgress;
                }
                else
                {
                    trackedProgress = SelectPrimaryProgress(
                        trackedGroup.OrderBy(x => _dbContext.Entry(x).State == EntityState.Added ? 1 : 0));
                    existing[trackedGroup.Key] = trackedProgress;
                }

                foreach (var duplicateTrackedProgress in trackedGroup.ToList())
                {
                    if (ReferenceEquals(trackedProgress, duplicateTrackedProgress))
                    {
                        continue;
                    }

                    if (MergeProgress(trackedProgress, duplicateTrackedProgress))
                    {
                        needSave = true;
                    }

                    _dbContext.Entry(duplicateTrackedProgress).State = EntityState.Detached;
                }
            }

            var lessonIdsByTopic = orderedLessons
                .GroupBy(x => x.TopicId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => x.LessonId).Distinct().ToList());

            var processedLessonIds = new HashSet<int>();

            for (int i = 0; i < orderedLessons.Count; i++)
            {
                int lessonId = orderedLessons[i].LessonId;

                if (!processedLessonIds.Add(lessonId))
                {
                    continue;
                }

                int bestScore = 0;
                int? totalQuestions = null;
                bool passedFromResults = false;

                if (bestResults.TryGetValue(lessonId, out var best))
                {
                    bestScore = best.BestScore;
                    totalQuestions = best.TotalQuestions;

                    if (totalQuestions.HasValue && totalQuestions.Value > 0)
                    {
                        passedFromResults = bestScore * 100 >= totalQuestions.Value * passingScorePercent;
                    }
                }

                bool shouldBeUnlocked = i == 0 || IsLessonUnlockedByCourseFlow(
                    orderedLessons,
                    i,
                    existing,
                    lessonIdsByTopic,
                    completedSceneTopicIds,
                    topicIdsWithScenes);

                if (!existing.TryGetValue(lessonId, out var p))
                {
                    p = _dbContext.UserLessonProgresses.Local
                        .FirstOrDefault(x => _dbContext.Entry(x).State != EntityState.Deleted && x.UserId == userId && x.LessonId == lessonId);

                    if (p == null)
                    {
                        p = _dbContext.UserLessonProgresses
                            .FirstOrDefault(x => x.UserId == userId && x.LessonId == lessonId);
                    }

                    if (p != null)
                    {
                        existing[lessonId] = p;
                    }
                }

                if (p == null)
                {
                    p = new UserLessonProgress
                    {
                        UserId = userId,
                        LessonId = lessonId,
                        IsUnlocked = shouldBeUnlocked,
                        IsCompleted = passedFromResults,
                        BestScore = bestScore,
                        LastAttemptAt = null
                    };

                    _dbContext.UserLessonProgresses.Add(p);
                    existing[lessonId] = p;
                    needSave = true;
                }
                else
                {
                    if (shouldBeUnlocked && !p.IsUnlocked)
                    {
                        p.IsUnlocked = true;
                        needSave = true;
                    }

                    if (passedFromResults && !p.IsCompleted)
                    {
                        p.IsCompleted = true;
                        needSave = true;
                    }

                    if (bestScore > p.BestScore)
                    {
                        p.BestScore = bestScore;
                        needSave = true;
                    }
                }
            }

            if (needSave)
            {
                PrepareTrackedUserLessonProgressesForSave(userId, lessonIds);

                try
                {
                    _dbContext.SaveChanges();
                }
                catch (DbUpdateException ex) when (IsUserLessonProgressDuplicateKey(ex))
                {
                    if (!ResolveConcurrentUserLessonProgressInsert(userId, lessonIds))
                    {
                        throw;
                    }

                    PrepareTrackedUserLessonProgressesForSave(userId, lessonIds);
                    _dbContext.SaveChanges();
                }
            }
        }

        private void PrepareTrackedUserLessonProgressesForSave(int userId, List<int> lessonIds)
        {
            var trackedGroups = _dbContext.ChangeTracker.Entries<UserLessonProgress>()
                .Where(x => x.State != EntityState.Deleted && x.Entity.UserId == userId && lessonIds.Contains(x.Entity.LessonId))
                .GroupBy(x => x.Entity.LessonId)
                .ToList();

            foreach (var trackedGroup in trackedGroups)
            {
                var primaryEntry = trackedGroup
                    .OrderBy(x => x.State == EntityState.Added ? 1 : 0)
                    .ThenByDescending(x => x.Entity.IsCompleted)
                    .ThenByDescending(x => x.Entity.BestScore)
                    .ThenByDescending(x => x.Entity.LastAttemptAt)
                    .ThenBy(x => x.Entity.Id)
                    .First();

                foreach (var duplicateEntry in trackedGroup)
                {
                    if (ReferenceEquals(primaryEntry, duplicateEntry))
                    {
                        continue;
                    }

                    if (MergeProgress(primaryEntry.Entity, duplicateEntry.Entity))
                    {
                        if (primaryEntry.State == EntityState.Unchanged)
                        {
                            primaryEntry.State = EntityState.Modified;
                        }
                    }

                    if (duplicateEntry.State == EntityState.Added)
                    {
                        duplicateEntry.State = EntityState.Detached;
                        continue;
                    }

                    duplicateEntry.State = EntityState.Deleted;
                }
            }
        }

        private bool ResolveConcurrentUserLessonProgressInsert(int userId, List<int> lessonIds)
        {
            var pendingEntries = _dbContext.ChangeTracker.Entries<UserLessonProgress>()
                .Where(x => x.State == EntityState.Added && x.Entity.UserId == userId && lessonIds.Contains(x.Entity.LessonId))
                .ToList();

            if (pendingEntries.Count == 0)
            {
                return false;
            }

            var dbProgressByLesson = _dbContext.UserLessonProgresses
                .AsNoTracking()
                .Where(x => x.UserId == userId && lessonIds.Contains(x.LessonId))
                .ToList()
                .GroupBy(x => x.LessonId)
                .ToDictionary(x => x.Key, x => SelectPrimaryProgress(x));

            bool resolved = false;

            foreach (var pendingEntry in pendingEntries)
            {
                if (!dbProgressByLesson.TryGetValue(pendingEntry.Entity.LessonId, out var fromDb))
                {
                    continue;
                }

                var trackedExistingEntry = _dbContext.ChangeTracker.Entries<UserLessonProgress>()
                    .FirstOrDefault(x =>
                        x.State != EntityState.Added &&
                        x.State != EntityState.Deleted &&
                        x.Entity.UserId == userId &&
                        x.Entity.LessonId == pendingEntry.Entity.LessonId);

                if (trackedExistingEntry == null)
                {
                    trackedExistingEntry = _dbContext.Attach(new UserLessonProgress
                    {
                        Id = fromDb.Id,
                        UserId = fromDb.UserId,
                        LessonId = fromDb.LessonId,
                        IsUnlocked = fromDb.IsUnlocked,
                        IsCompleted = fromDb.IsCompleted,
                        BestScore = fromDb.BestScore,
                        LastAttemptAt = fromDb.LastAttemptAt
                    });
                }
                else
                {
                    var trackedExisting = trackedExistingEntry.Entity;

                    if (!trackedExisting.IsUnlocked && fromDb.IsUnlocked)
                    {
                        trackedExisting.IsUnlocked = true;
                    }

                    if (!trackedExisting.IsCompleted && fromDb.IsCompleted)
                    {
                        trackedExisting.IsCompleted = true;
                    }

                    if (fromDb.BestScore > trackedExisting.BestScore)
                    {
                        trackedExisting.BestScore = fromDb.BestScore;
                    }

                    if (trackedExisting.LastAttemptAt == null ||
                        (fromDb.LastAttemptAt.HasValue && fromDb.LastAttemptAt > trackedExisting.LastAttemptAt))
                    {
                        trackedExisting.LastAttemptAt = fromDb.LastAttemptAt;
                    }
                }

                if (MergeProgress(trackedExistingEntry.Entity, pendingEntry.Entity) && trackedExistingEntry.State == EntityState.Unchanged)
                {
                    trackedExistingEntry.State = EntityState.Modified;
                }

                pendingEntry.State = EntityState.Detached;
                resolved = true;
            }

            return resolved;
        }

        private static bool IsUserLessonProgressDuplicateKey(DbUpdateException ex)
        {
            var message = ex.InnerException?.Message ?? ex.Message;

            return message.Contains("UserLessonProgresses", StringComparison.OrdinalIgnoreCase)
                && message.Contains("IX_UserLessonProgresses_UserId_LessonId", StringComparison.OrdinalIgnoreCase);
        }


        private static Dictionary<int, int> BuildEffectiveTopicIdBySceneId(List<Scene> scenes, List<int> topicOrderIds)
        {
            var result = new Dictionary<int, int>();

            if (scenes == null || scenes.Count == 0 || topicOrderIds == null || topicOrderIds.Count == 0)
            {
                return result;
            }

            var sceneGroups = scenes
                .GroupBy(x => x.CourseId)
                .ToList();

            foreach (var sceneGroup in sceneGroups)
            {
                var orderedSceneGroup = sceneGroup
                    .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                    .ThenBy(x => x.Id)
                    .ToList();

                for (int i = 0; i < orderedSceneGroup.Count; i++)
                {
                    var scene = orderedSceneGroup[i];

                    if (scene.TopicId.HasValue)
                    {
                        result[scene.Id] = scene.TopicId.Value;
                        continue;
                    }

                    if (i < topicOrderIds.Count)
                    {
                        result[scene.Id] = topicOrderIds[i];
                    }
                }
            }

            return result;
        }

        private bool IsLessonUnlockedByCourseFlow(
            List<OrderedLessonInfo> orderedLessons,
            int currentIndex,
            Dictionary<int, UserLessonProgress> existing,
            Dictionary<int, List<int>> lessonIdsByTopic,
            HashSet<int> completedSceneTopicIds,
            HashSet<int> topicIdsWithScenes)
        {
            if (currentIndex <= 0)
            {
                return true;
            }

            var current = orderedLessons[currentIndex];
            var previous = orderedLessons[currentIndex - 1];

            if (!existing.TryGetValue(previous.LessonId, out var previousProgress) || !previousProgress.IsCompleted)
            {
                return false;
            }

            if (current.TopicId == previous.TopicId)
            {
                return true;
            }

            return IsTopicGatewayCompleted(previous.TopicId, existing, lessonIdsByTopic, completedSceneTopicIds, topicIdsWithScenes);
        }

        private bool IsTopicGatewayCompleted(
            int topicId,
            Dictionary<int, UserLessonProgress> existing,
            Dictionary<int, List<int>> lessonIdsByTopic,
            HashSet<int> completedSceneTopicIds,
            HashSet<int> topicIdsWithScenes)
        {
            if (!lessonIdsByTopic.TryGetValue(topicId, out var topicLessonIds) || topicLessonIds.Count == 0)
            {
                return true;
            }

            bool allLessonsCompleted = topicLessonIds.All(x => existing.ContainsKey(x) && existing[x].IsCompleted);

            if (!allLessonsCompleted)
            {
                return false;
            }

            if (!topicIdsWithScenes.Contains(topicId))
            {
                return true;
            }

            return completedSceneTopicIds.Contains(topicId);
        }

        private static UserLessonProgress SelectPrimaryProgress(IEnumerable<UserLessonProgress> progresses)
        {
            return progresses
                .OrderByDescending(x => x.IsCompleted)
                .ThenByDescending(x => x.BestScore)
                .ThenByDescending(x => x.LastAttemptAt)
                .ThenBy(x => x.Id)
                .First();
        }

        private static bool MergeProgress(UserLessonProgress target, UserLessonProgress source)
        {
            bool changed = false;

            if (!target.IsUnlocked && source.IsUnlocked)
            {
                target.IsUnlocked = true;
                changed = true;
            }

            if (!target.IsCompleted && source.IsCompleted)
            {
                target.IsCompleted = true;
                changed = true;
            }

            if (source.BestScore > target.BestScore)
            {
                target.BestScore = source.BestScore;
                changed = true;
            }

            if (target.LastAttemptAt == null ||
                (source.LastAttemptAt.HasValue && source.LastAttemptAt > target.LastAttemptAt))
            {
                if (target.LastAttemptAt != source.LastAttemptAt)
                {
                    target.LastAttemptAt = source.LastAttemptAt;
                    changed = true;
                }
            }

            return changed;
        }

        private class OrderedLessonInfo
        {
            public int TopicId { get; set; }
            public string TopicTitle { get; set; } = "";
            public int TopicOrder { get; set; }
            public int LessonId { get; set; }
            public string LessonTitle { get; set; } = "";
            public int LessonOrder { get; set; }
        }

        private class BestLessonResult
        {
            public int LessonId { get; set; }
            public int BestScore { get; set; }
            public int TotalQuestions { get; set; }
        }
    }
}
