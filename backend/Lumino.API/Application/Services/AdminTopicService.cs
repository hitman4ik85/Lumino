using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;

namespace Lumino.Api.Application.Services
{
    public class AdminTopicService : IAdminTopicService
    {
        private readonly LuminoDbContext _dbContext;

        public AdminTopicService(LuminoDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public List<AdminTopicResponse> GetByCourse(int courseId)
        {
            return _dbContext.Topics
                .Where(x => x.CourseId == courseId)
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
        }

        public AdminTopicDetailsResponse GetById(int id)
        {
            var topic = _dbContext.Topics.FirstOrDefault(x => x.Id == id);

            if (topic == null)
            {
                throw new KeyNotFoundException("Topic not found");
            }

            var lessons = _dbContext.Lessons
                .Where(x => x.TopicId == id)
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .Select(x => new AdminLessonResponse
                {
                    Id = x.Id,
                    TopicId = x.TopicId,
                    Title = x.Title,
                    Theory = x.Theory,
                    Order = x.Order
                })
                .ToList();

            var lessonIds = lessons.Select(x => x.Id).ToList();

            var exercisesCount = _dbContext.Exercises.Count(x => lessonIds.Contains(x.LessonId));

            return new AdminTopicDetailsResponse
            {
                Id = topic.Id,
                CourseId = topic.CourseId,
                Title = topic.Title,
                Order = topic.Order,
                LessonsCount = lessons.Count,
                ExercisesCount = exercisesCount,
                Lessons = lessons
            };
        }

        public AdminTopicResponse Create(CreateTopicRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            EnsureCourseHasTopicSlot(request.CourseId);

            var order = NormalizeOrder(request.Order);

            ValidateTopicOrderRange(order);
            ValidateUniqueTopicOrder(request.CourseId, order, ignoreTopicId: null);

            var topic = new Topic
            {
                CourseId = request.CourseId,
                Title = request.Title,
                Order = order
            };

            _dbContext.Topics.Add(topic);
            _dbContext.SaveChanges();

            CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, topic.CourseId);

            return new AdminTopicResponse
            {
                Id = topic.Id,
                CourseId = topic.CourseId,
                Title = topic.Title,
                Order = topic.Order
            };
        }

        public void Update(int id, UpdateTopicRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var topic = _dbContext.Topics.FirstOrDefault(x => x.Id == id);

            if (topic == null)
            {
                throw new KeyNotFoundException("Topic not found");
            }

            var order = NormalizeOrder(request.Order);

            ValidateTopicOrderRange(order);
            ValidateUniqueTopicOrder(topic.CourseId, order, ignoreTopicId: topic.Id);

            topic.Title = request.Title;
            topic.Order = order;

            SyncTopicScene(topic);

            _dbContext.SaveChanges();

            CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, topic.CourseId);
        }

        public void Delete(int id)
        {
            var topic = _dbContext.Topics.FirstOrDefault(x => x.Id == id);

            if (topic == null)
            {
                throw new KeyNotFoundException("Topic not found");
            }

            var scenes = _dbContext.Scenes
                .Where(x => x.TopicId == id)
                .ToList();

            if (scenes.Count > 0)
            {
                var sceneIds = scenes.Select(x => x.Id).ToList();
                var sceneSteps = _dbContext.SceneSteps
                    .Where(x => sceneIds.Contains(x.SceneId))
                    .ToList();
                var sceneAttempts = _dbContext.SceneAttempts
                    .Where(x => sceneIds.Contains(x.SceneId))
                    .ToList();

                if (sceneSteps.Count > 0)
                {
                    _dbContext.SceneSteps.RemoveRange(sceneSteps);
                }

                if (sceneAttempts.Count > 0)
                {
                    _dbContext.SceneAttempts.RemoveRange(sceneAttempts);
                }

                _dbContext.Scenes.RemoveRange(scenes);
            }

            var courseId = topic.CourseId;

            _dbContext.Topics.Remove(topic);
            _dbContext.SaveChanges();

            CoursePublicationGuard.UnpublishIfStructureIncomplete(_dbContext, courseId);
        }

        private int NormalizeOrder(int order)
        {
            return order < 0 ? 0 : order;
        }

        private void EnsureCourseHasTopicSlot(int courseId)
        {
            var topicsCount = _dbContext.Topics.Count(x => x.CourseId == courseId);

            if (topicsCount >= CourseStructureLimits.TopicsPerCourse)
            {
                throw new ArgumentException($"Course can contain at most {CourseStructureLimits.TopicsPerCourse} topics");
            }
        }

        private void ValidateTopicOrderRange(int order)
        {
            if (order <= 0)
            {
                return;
            }

            if (order > CourseStructureLimits.TopicsPerCourse)
            {
                throw new ArgumentException($"Topic Order must be between 1 and {CourseStructureLimits.TopicsPerCourse}");
            }
        }

        private void ValidateUniqueTopicOrder(int courseId, int order, int? ignoreTopicId)
        {
            if (order <= 0)
            {
                return;
            }

            var hasDuplicate = _dbContext.Topics.Any(x =>
                x.CourseId == courseId &&
                x.Order == order &&
                (ignoreTopicId == null || x.Id != ignoreTopicId));

            if (hasDuplicate)
            {
                throw new ArgumentException("Order is already used in this course");
            }
        }

        private void SyncTopicScene(Topic topic)
        {
            var topicScene = _dbContext.Scenes.FirstOrDefault(x => x.TopicId == topic.Id);

            if (topicScene == null)
            {
                return;
            }

            if (topicScene.CourseId != topic.CourseId)
            {
                topicScene.CourseId = topic.CourseId;
            }

            if (topic.Order <= 0)
            {
                topicScene.Order = 0;
                return;
            }

            var conflictingScene = _dbContext.Scenes.FirstOrDefault(x =>
                x.CourseId == topic.CourseId &&
                x.Order == topic.Order &&
                x.Id != topicScene.Id);

            if (conflictingScene != null)
            {
                if (conflictingScene.TopicId.HasValue && conflictingScene.TopicId.Value != topic.Id)
                {
                    return;
                }

                conflictingScene.Order = 0;
            }

            topicScene.Order = topic.Order;
        }
    }
}
