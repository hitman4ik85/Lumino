using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Microsoft.EntityFrameworkCore;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;

namespace Lumino.Api.Application.Services
{
    public class AdminSceneService : IAdminSceneService
    {
        private readonly LuminoDbContext _dbContext;

        public AdminSceneService(LuminoDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public List<AdminSceneResponse> GetAll()
        {
            return _dbContext.Scenes
                .AsEnumerable()
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .Select(x => new AdminSceneResponse
                {
                    Id = x.Id,
                    CourseId = x.CourseId,
                    TopicId = x.TopicId,
                    Order = x.Order,
                    Title = x.Title,
                    Description = x.Description,
                    SceneType = x.SceneType,
                    BackgroundUrl = x.BackgroundUrl,
                    AudioUrl = x.AudioUrl
                })
                .ToList();
        }

        public AdminSceneDetailsResponse GetById(int id)
        {
            var scene = _dbContext.Scenes.FirstOrDefault(x => x.Id == id);

            if (scene == null)
            {
                throw new KeyNotFoundException("Scene not found");
            }

            var steps = GetStepsInternal(id);

            return new AdminSceneDetailsResponse
            {
                Id = scene.Id,
                CourseId = scene.CourseId,
                Order = scene.Order,
                Title = scene.Title,
                Description = scene.Description,
                SceneType = scene.SceneType,
                BackgroundUrl = scene.BackgroundUrl,
                AudioUrl = scene.AudioUrl,
                TopicId = scene.TopicId,
                Steps = steps
            };
        }

        public ExportSceneJson Export(int id)
        {
            var scene = _dbContext.Scenes.FirstOrDefault(x => x.Id == id);

            if (scene == null)
            {
                throw new KeyNotFoundException("Scene not found");
            }

            var steps = _dbContext.SceneSteps
                .Where(x => x.SceneId == id)
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .Select(x => new ExportSceneStepJson
                {
                    Order = x.Order,
                    Speaker = x.Speaker,
                    Text = x.Text,
                    StepType = x.StepType,
                    MediaUrl = x.MediaUrl,
                    ChoicesJson = x.ChoicesJson
                })
                .ToList();

            return new ExportSceneJson
            {
                CourseId = scene.CourseId,
                Order = scene.Order,
                Title = scene.Title,
                Description = scene.Description,
                SceneType = scene.SceneType,
                BackgroundUrl = scene.BackgroundUrl,
                AudioUrl = scene.AudioUrl,
                TopicId = scene.TopicId,
                Steps = steps
            };
        }

        public AdminSceneDetailsResponse Import(ExportSceneJson request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var useTransaction = _dbContext.Database.ProviderName == null ||
                                 !_dbContext.Database.ProviderName.Contains("InMemory", StringComparison.OrdinalIgnoreCase);

            using var transaction = useTransaction ? _dbContext.Database.BeginTransaction() : null;

            try
            {
                var courseId = NormalizeCourseIdOrNull(request.CourseId);
                var sceneOrder = NormalizeSceneOrder(courseId, request.Order);

                ValidateSceneOrderRange(sceneOrder);
                ValidateUniqueSceneOrder(courseId, sceneOrder, null);
                ValidateScenePlacement(request.TopicId, courseId, null);

                var scene = new Scene
                {
                    Title = request.Title,
                    Description = request.Description,
                    SceneType = request.SceneType,
                    BackgroundUrl = request.BackgroundUrl,
                    CourseId = courseId,
                    Order = sceneOrder,
                    AudioUrl = request.AudioUrl,
                    TopicId = request.TopicId
                };

                _dbContext.Scenes.Add(scene);
                _dbContext.SaveChanges();

                if (request.Steps != null && request.Steps.Count > 0)
                {
                    var normalizedSteps = request.Steps
                        .Select(x => new CreateSceneStepRequest
                        {
                            Order = x.Order,
                            Speaker = x.Speaker,
                            Text = x.Text,
                            StepType = x.StepType,
                            MediaUrl = x.MediaUrl,
                            ChoicesJson = x.ChoicesJson
                        })
                        .ToList();

                    NormalizeStepsOrders(normalizedSteps);
                    ValidateStepsOrders(normalizedSteps);

                    var steps = normalizedSteps
                        .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                        .Select(x => new SceneStep
                        {
                            SceneId = scene.Id,
                            Order = x.Order,
                            Speaker = x.Speaker,
                            Text = x.Text,
                            StepType = x.StepType,
                            MediaUrl = x.MediaUrl,
                            ChoicesJson = x.ChoicesJson
                        })
                        .ToList();

                    _dbContext.SceneSteps.AddRange(steps);
                    _dbContext.SaveChanges();
                }

                CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, courseId);
                transaction?.Commit();

                return GetById(scene.Id);
            }
            catch
            {
                transaction?.Rollback();
                throw;
            }
        }

        public AdminSceneDetailsResponse Copy(int id, CopyItemRequest? request)
        {
            var source = _dbContext.Scenes.FirstOrDefault(x => x.Id == id);

            if (source == null)
            {
                throw new KeyNotFoundException("Scene not found");
            }

            int? targetCourseId = request?.TargetCourseId ?? source.CourseId;
            int? targetTopicId = request?.TargetTopicId ?? source.TopicId;

            if (targetCourseId.HasValue && targetCourseId.Value > 0)
            {
                var courseExists = _dbContext.Courses.Any(x => x.Id == targetCourseId.Value);

                if (!courseExists)
                {
                    throw new KeyNotFoundException("Target course not found");
                }
            }

            ValidateScenePlacement(targetTopicId, targetCourseId, null);


            var suffix = string.IsNullOrWhiteSpace(request?.TitleSuffix)
                ? " (Copy)"
                : request!.TitleSuffix!.Trim();

            if (!suffix.StartsWith(" "))
            {
                suffix = " " + suffix;
            }
            var useTransaction = _dbContext.Database.ProviderName == null ||
                                             !_dbContext.Database.ProviderName.Contains("InMemory", StringComparison.OrdinalIgnoreCase);

            using var transaction = useTransaction ? _dbContext.Database.BeginTransaction() : null;

            try
            {
                var newScene = new Scene
                {
                    Title = source.Title + suffix,
                    Description = source.Description,
                    SceneType = source.SceneType,
                    BackgroundUrl = source.BackgroundUrl,
                    AudioUrl = source.AudioUrl,
                    CourseId = targetCourseId,
                    TopicId = targetTopicId,
                    Order = GetNextAvailableSceneOrder(targetCourseId)
                };

                _dbContext.Scenes.Add(newScene);
                _dbContext.SaveChanges();

                var steps = _dbContext.SceneSteps
                    .Where(x => x.SceneId == source.Id)
                    .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                    .ThenBy(x => x.Id)
                    .ToList();

                foreach (var step in steps)
                {
                    _dbContext.SceneSteps.Add(new SceneStep
                    {
                        SceneId = newScene.Id,
                        Order = step.Order,
                        Speaker = step.Speaker,
                        Text = step.Text,
                        StepType = step.StepType,
                        MediaUrl = step.MediaUrl,
                        ChoicesJson = step.ChoicesJson
                    });
                }

                _dbContext.SaveChanges();

                CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, targetCourseId);

                transaction?.Commit();

                return GetById(newScene.Id);
            }
            catch
            {
                transaction?.Rollback();
                throw;
            }
        }

        public AdminSceneDetailsResponse Create(CreateSceneRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            NormalizeStepsOrders(request.Steps);
            ValidateStepsOrders(request.Steps);

            var courseId = NormalizeCourseIdOrNull(request.CourseId);
            var sceneOrder = NormalizeSceneOrder(courseId, request.Order);

            ValidateSceneOrderRange(sceneOrder);
            ValidateScenePlacement(request.TopicId, courseId, null);
            ValidateUniqueSceneOrder(courseId, sceneOrder, null);

            var scene = new Scene
            {
                Title = request.Title,
                Description = request.Description,
                SceneType = request.SceneType,
                BackgroundUrl = request.BackgroundUrl,
                CourseId = courseId,
                Order = sceneOrder,
                AudioUrl = request.AudioUrl,
                TopicId = request.TopicId
            };

            _dbContext.Scenes.Add(scene);
            _dbContext.SaveChanges();

            if (request.Steps != null && request.Steps.Count > 0)
            {
                var steps = request.Steps
                    .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                    .Select(x => new SceneStep
                    {
                        SceneId = scene.Id,
                        Order = x.Order,
                        Speaker = x.Speaker,
                        Text = x.Text,
                        StepType = x.StepType,
                        MediaUrl = x.MediaUrl,
                        ChoicesJson = x.ChoicesJson
                    })
                    .ToList();

                _dbContext.SceneSteps.AddRange(steps);
                _dbContext.SaveChanges();
            }

            CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, courseId);

            return GetById(scene.Id);
        }

        public void Update(int id, UpdateSceneRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var scene = _dbContext.Scenes.FirstOrDefault(x => x.Id == id);

            if (scene == null)
            {
                throw new KeyNotFoundException("Scene not found");
            }

            var previousCourseId = scene.CourseId;
            var courseId = NormalizeCourseIdOrNull(request.CourseId);
            var sceneOrder = NormalizeSceneOrder(courseId, request.Order);

            ValidateSceneOrderRange(sceneOrder);
            ValidateScenePlacement(request.TopicId, courseId, id);
            ValidateUniqueSceneOrder(courseId, sceneOrder, id);

            scene.Title = request.Title;
            scene.Description = request.Description;
            scene.CourseId = courseId;
            scene.Order = sceneOrder;
            scene.SceneType = request.SceneType;
            scene.BackgroundUrl = request.BackgroundUrl;
            scene.AudioUrl = request.AudioUrl;
            scene.TopicId = request.TopicId;

            _dbContext.SaveChanges();

            CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, previousCourseId, courseId);
        }

        public AdminSceneDetailsResponse AssignSceneToTopic(int sceneId, AssignSceneToTopicRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            if (request.TopicId <= 0)
            {
                throw new ArgumentException("TopicId is required");
            }

            var scene = _dbContext.Scenes.FirstOrDefault(x => x.Id == sceneId);

            if (scene == null)
            {
                throw new KeyNotFoundException("Scene not found");
            }

            var topic = _dbContext.Topics.FirstOrDefault(x => x.Id == request.TopicId);

            if (topic == null)
            {
                throw new KeyNotFoundException("Topic not found");
            }

            if (!string.Equals(scene.SceneType, CourseStructureLimits.FinalSceneType, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException($"Only scenes with SceneType='{CourseStructureLimits.FinalSceneType}' can be assigned to a topic");
            }

            var previousCourseId = scene.CourseId;
            var useTransaction = _dbContext.Database.ProviderName == null ||
                                 !_dbContext.Database.ProviderName.Contains("InMemory", StringComparison.OrdinalIgnoreCase);

            using var transaction = useTransaction ? _dbContext.Database.BeginTransaction() : null;

            try
            {
                var currentTopicScene = _dbContext.Scenes.FirstOrDefault(x => x.TopicId == topic.Id && x.Id != scene.Id);

                if (currentTopicScene != null)
                {
                    currentTopicScene.TopicId = null;

                    if (currentTopicScene.CourseId == topic.CourseId && currentTopicScene.Order == topic.Order)
                    {
                        currentTopicScene.Order = 0;
                    }
                }

                scene.CourseId = topic.CourseId;
                scene.TopicId = topic.Id;

                if (topic.Order > 0)
                {
                    var sceneWithSameOrder = _dbContext.Scenes.FirstOrDefault(x =>
                        x.CourseId == topic.CourseId &&
                        x.Order == topic.Order &&
                        x.Id != scene.Id &&
                        (currentTopicScene == null || x.Id != currentTopicScene.Id));

                    if (sceneWithSameOrder == null)
                    {
                        scene.Order = topic.Order;
                    }
                }

                _dbContext.SaveChanges();
                CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, previousCourseId, topic.CourseId);
                transaction?.Commit();

                return GetById(scene.Id);
            }
            catch
            {
                transaction?.Rollback();
                throw;
            }
        }

        public void Delete(int id)
        {
            var scene = _dbContext.Scenes.FirstOrDefault(x => x.Id == id);

            if (scene == null)
            {
                throw new KeyNotFoundException("Scene not found");
            }

            var steps = _dbContext.SceneSteps.Where(x => x.SceneId == id).ToList();
            var attempts = _dbContext.SceneAttempts.Where(x => x.SceneId == id).ToList();

            if (steps.Count > 0)
            {
                _dbContext.SceneSteps.RemoveRange(steps);
            }

            if (attempts.Count > 0)
            {
                _dbContext.SceneAttempts.RemoveRange(attempts);
            }

            var courseId = scene.CourseId;

            _dbContext.Scenes.Remove(scene);
            _dbContext.SaveChanges();

            CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, courseId);
        }

        public List<AdminSceneStepResponse> GetSteps(int sceneId)
        {
            EnsureSceneExists(sceneId);

            return GetStepsInternal(sceneId);
        }

        public AdminSceneStepResponse AddStep(int sceneId, CreateSceneStepRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            EnsureSceneExists(sceneId);

            var stepOrder = NormalizeOrder(request.Order);

            bool orderExists = stepOrder > 0 && _dbContext.SceneSteps
                .Any(x => x.SceneId == sceneId && x.Order == stepOrder);

            if (orderExists)
            {
                throw new ArgumentException("Step with this Order already exists");
            }

            var step = new SceneStep
            {
                SceneId = sceneId,
                Order = stepOrder,
                Speaker = request.Speaker,
                Text = request.Text,
                StepType = request.StepType,
                MediaUrl = request.MediaUrl,
                ChoicesJson = request.ChoicesJson
            };

            _dbContext.SceneSteps.Add(step);
            _dbContext.SaveChanges();

            return new AdminSceneStepResponse
            {
                Id = step.Id,
                SceneId = step.SceneId,
                Order = step.Order,
                Speaker = step.Speaker,
                Text = step.Text,
                StepType = step.StepType,
                MediaUrl = step.MediaUrl,
                ChoicesJson = step.ChoicesJson
            };
        }

        public void UpdateStep(int sceneId, int stepId, UpdateSceneStepRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            EnsureSceneExists(sceneId);

            var step = _dbContext.SceneSteps.FirstOrDefault(x => x.Id == stepId && x.SceneId == sceneId);

            if (step == null)
            {
                throw new KeyNotFoundException("Scene step not found");
            }

            var stepOrder = NormalizeOrder(request.Order);

            bool orderExists = stepOrder > 0 && _dbContext.SceneSteps
                .Any(x => x.SceneId == sceneId && x.Order == stepOrder && x.Id != stepId);

            if (orderExists)
            {
                throw new ArgumentException("Step with this Order already exists");
            }

            step.Order = stepOrder;
            step.Speaker = request.Speaker;
            step.Text = request.Text;
            step.StepType = request.StepType;
            step.MediaUrl = request.MediaUrl;
            step.ChoicesJson = request.ChoicesJson;

            _dbContext.SaveChanges();
        }

        public void DeleteStep(int sceneId, int stepId)
        {
            EnsureSceneExists(sceneId);

            var step = _dbContext.SceneSteps.FirstOrDefault(x => x.Id == stepId && x.SceneId == sceneId);

            if (step == null)
            {
                throw new KeyNotFoundException("Scene step not found");
            }

            _dbContext.SceneSteps.Remove(step);
            _dbContext.SaveChanges();
        }

        private void EnsureSceneExists(int sceneId)
        {
            bool exists = _dbContext.Scenes.Any(x => x.Id == sceneId);

            if (!exists)
            {
                throw new KeyNotFoundException("Scene not found");
            }
        }

        private List<AdminSceneStepResponse> GetStepsInternal(int sceneId)
        {
            return _dbContext.SceneSteps
                .Where(x => x.SceneId == sceneId)
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .Select(x => new AdminSceneStepResponse
                {
                    Id = x.Id,
                    SceneId = x.SceneId,
                    Order = x.Order,
                    Speaker = x.Speaker,
                    Text = x.Text,
                    StepType = x.StepType,
                    MediaUrl = x.MediaUrl,
                    ChoicesJson = x.ChoicesJson
                })
                .ToList();
        }

        private void ValidateSceneOrderRange(int order)
        {
            if (order <= 0)
            {
                return;
            }

            if (order > CourseStructureLimits.TopicsPerCourse)
            {
                throw new ArgumentException($"Scene Order must be between 1 and {CourseStructureLimits.TopicsPerCourse}");
            }
        }

        private void ValidateScenePlacement(int? topicId, int? courseId, int? ignoreSceneId)
        {
            if (topicId.HasValue && topicId.Value > 0 && (!courseId.HasValue || courseId.Value <= 0))
            {
                throw new ArgumentException("Scene CourseId is required for a topic scene");
            }

            if (courseId.HasValue && courseId.Value > 0)
            {
                if (!topicId.HasValue || topicId.Value <= 0)
                {
                    throw new ArgumentException("Scene TopicId is required for a course scene");
                }

                var topic = _dbContext.Topics.FirstOrDefault(x => x.Id == topicId.Value);

                if (topic == null)
                {
                    throw new KeyNotFoundException("Topic not found");
                }

                if (topic.CourseId != courseId.Value)
                {
                    throw new ArgumentException("Scene topic must belong to the selected course");
                }

                var topicScenesCount = _dbContext.Scenes.Count(x =>
                    x.TopicId == topicId.Value &&
                    (ignoreSceneId == null || x.Id != ignoreSceneId.Value));

                if (topicScenesCount >= CourseStructureLimits.ScenesPerTopic)
                {
                    throw new ArgumentException($"Topic can contain only {CourseStructureLimits.ScenesPerTopic} scene");
                }

                return;
            }

        }

        private int? NormalizeCourseIdOrNull(int? requestCourseId)
        {
            if (!requestCourseId.HasValue || requestCourseId.Value <= 0)
            {
                return null;
            }

            var exists = _dbContext.Courses.Any(x => x.Id == requestCourseId.Value);

            if (!exists)
            {
                throw new KeyNotFoundException("Course not found");
            }

            return requestCourseId.Value;
        }

        private void ValidateUniqueSceneOrder(int? courseId, int order, int? ignoreSceneId)
        {
            if (order <= 0)
            {
                return;
            }

            if (!courseId.HasValue || courseId.Value <= 0)
            {
                return;
            }

            bool exists = _dbContext.Scenes.Any(x => x.CourseId == courseId.Value && x.Order == order
                                               && (!ignoreSceneId.HasValue || x.Id != ignoreSceneId.Value));

            if (exists)
            {
                throw new ArgumentException("Scene with this Order already exists in this course");
            }
        }

        private int GetNextAvailableSceneOrder(int? courseId)
        {
            if (!courseId.HasValue || courseId.Value <= 0)
            {
                return 0;
            }

            var usedOrders = _dbContext.Scenes
                .Where(x => x.CourseId == courseId.Value && x.Order > 0)
                .Select(x => x.Order)
                .Distinct()
                .ToHashSet();

            for (int order = 1; order <= CourseStructureLimits.TopicsPerCourse; order++)
            {
                if (!usedOrders.Contains(order))
                {
                    return order;
                }
            }

            return 0;
        }

        private void NormalizeStepsOrders(List<CreateSceneStepRequest> steps)
        {
            if (steps == null || steps.Count == 0)
            {
                return;
            }

            foreach (var step in steps)
            {
                if (step.Order < 0)
                {
                    step.Order = 0;
                }
            }
        }

        private void ValidateStepsOrders(List<CreateSceneStepRequest> steps)
        {
            if (steps == null || steps.Count == 0)
            {
                return;
            }

            // Дублі дозволені, якщо Order <= 0 (вони підуть у кінець і стабілізуються по Id)
            // Для Order > 0 — дублі заборонені
            var duplicateOrders = steps
                .Where(x => x.Order > 0)
                .GroupBy(x => x.Order)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();

            if (duplicateOrders.Count > 0)
            {
                throw new ArgumentException("Duplicate step Order values");
            }
        }

        private int NormalizeOrder(int order)
        {
            return order < 0 ? 0 : order;
        }

        private int NormalizeSceneOrder(int? courseId, int order)
        {
            if (!courseId.HasValue || courseId.Value <= 0)
            {
                return 0;
            }

            return NormalizeOrder(order);
        }
    }
}
