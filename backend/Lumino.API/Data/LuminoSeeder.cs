using Lumino.Api.Domain.Entities;
using Lumino.Api.Application.DTOs;
using Lumino.Api.Domain.Enums;
using Lumino.Api.Utils;
using Lumino.Api.Data.Seeder;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Lumino.Api.Data
{
    public static class LuminoSeeder
    {
        public static void Seed(WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<LuminoDbContext>();

            dbContext.Database.Migrate();

            SeedAdmin(dbContext);
            SeedUser(dbContext);

            SeedAchievements(dbContext);
            SeedScenes(dbContext);
            SeedVocabulary(dbContext);
            SeedDemoContentEnglishOnly(dbContext);
            LinkScenesToDefaultCourse(dbContext);

            SeedVocabularyLinks(dbContext);

            EnsureVocabularyBaseTranslations(dbContext);
        }

        private static void SeedAdmin(LuminoDbContext dbContext)
        {
            var adminEmail = "admin@lumino.local";

            var admin = dbContext.Users.FirstOrDefault(x => x.Email == adminEmail);
            if (admin != null)
            {
                return;
            }

            var hasher = new PasswordHasher();

            admin = new User
            {
                Email = adminEmail,
                PasswordHash = hasher.Hash("Admin123!"),
                Role = Role.Admin,
                IsEmailVerified = true,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.Users.Add(admin);
            dbContext.SaveChanges();

        }

        private static void SeedUser(LuminoDbContext dbContext)
        {
            var userEmail = "user@lumino.local";

            var user = dbContext.Users.FirstOrDefault(x => x.Email == userEmail);
            if (user != null)
            {
                return;
            }

            var hasher = new PasswordHasher();

            user = new User
            {
                Email = userEmail,
                PasswordHash = hasher.Hash("User123!"),
                Role = Role.User,
                IsEmailVerified = true,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.Users.Add(user);
            dbContext.SaveChanges();
        }

        private static void SeedAchievements(LuminoDbContext dbContext)
        {
            var achievements = AchievementSeederData.GetAchievements();

            var fromDbList = dbContext.Achievements.ToList();
            var fromDbMap = fromDbList
                .Where(x => !string.IsNullOrWhiteSpace(x.Code))
                .GroupBy(x => x.Code)
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

            var fromDbTitleMap = fromDbList
                .GroupBy(x => x.Title)
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

            foreach (var item in achievements)
            {
                if (fromDbMap.TryGetValue(item.Code, out var fromDb))
                {
                    // Do not overwrite Title/Description here to keep admin edits.
                    continue;
                }

                // Backward-compatibility: old DB rows could exist without Code.
                if (fromDbTitleMap.TryGetValue(item.Title, out var byTitle) && string.IsNullOrWhiteSpace(byTitle.Code))
                {
                    byTitle.Code = item.Code;
                    continue;
                }

                dbContext.Achievements.Add(item);
            }

            dbContext.SaveChanges();
        }

        private static void SeedScenes(LuminoDbContext dbContext)
        {
            var scenes = LessonSeederData.GetScenes();

            var fromDbList = dbContext.Scenes.ToList();
            var fromDbMap = fromDbList
                .GroupBy(x => x.Title)
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

            var orderUpdates = new Dictionary<int, int>();
            foreach (var item in scenes)
            {
                if (!fromDbMap.TryGetValue(item.Title, out var fromDb))
                {
                    dbContext.Scenes.Add(item);
                    continue;
                }

                if (fromDb.Description != item.Description)
                {
                    fromDb.Description = item.Description;
                }

                if (fromDb.SceneType != item.SceneType)
                {
                    fromDb.SceneType = item.SceneType;
                }

                if (!string.IsNullOrWhiteSpace(item.BackgroundUrl) && fromDb.BackgroundUrl != item.BackgroundUrl)
                {
                    fromDb.BackgroundUrl = item.BackgroundUrl;
                }

                if (!string.IsNullOrWhiteSpace(item.AudioUrl) && fromDb.AudioUrl != item.AudioUrl)
                {
                    fromDb.AudioUrl = item.AudioUrl;
                }
                if (item.Order > 0 && fromDb.Order != item.Order)
                {
                    // Safe update for unique index (CourseId, Order) where Order > 0:
                    // if the scene is already linked to a course, change order in 2 steps to avoid collisions.
                    if (fromDb.CourseId != null && fromDb.CourseId > 0 && fromDb.Order > 0)
                    {
                        fromDb.Order = 0;
                        orderUpdates[fromDb.Id] = item.Order;
                    }
                    else
                    {
                        fromDb.Order = item.Order;
                    }
                }
            }

            dbContext.SaveChanges();

            if (orderUpdates.Count > 0)
            {
                var ids = orderUpdates.Keys.ToList();

                var toFix = dbContext.Scenes
                    .Where(x => ids.Contains(x.Id))
                    .ToList();

                foreach (var s in toFix)
                {
                    if (orderUpdates.TryGetValue(s.Id, out var newOrder))
                    {
                        s.Order = newOrder;
                    }
                }

                dbContext.SaveChanges();
            }

            var sceneMap = dbContext.Scenes
                .ToList()
                .GroupBy(x => x.Title)
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

            var stepsBySceneTitle = LessonSeederData.GetSceneStepsBySceneTitle();

            var fromStepsList = dbContext.SceneSteps.ToList();
            var fromStepsMap = fromStepsList
                .GroupBy(x => $"{x.SceneId}:{x.Order}")
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

            foreach (var kv in stepsBySceneTitle)
            {
                if (!sceneMap.TryGetValue(kv.Key, out var scene))
                {
                    continue;
                }

                foreach (var step in kv.Value)
                {
                    var key = $"{scene.Id}:{step.Order}";

                    if (!fromStepsMap.TryGetValue(key, out var fromDb))
                    {
                        dbContext.SceneSteps.Add(new SceneStep
                        {
                            SceneId = scene.Id,
                            Order = step.Order,
                            Speaker = step.Speaker,
                            Text = step.Text,
                            StepType = step.StepType,
                            MediaUrl = step.MediaUrl,
                            ChoicesJson = step.ChoicesJson
                        });

                        continue;
                    }

                    if (fromDb.Speaker != step.Speaker)
                    {
                        fromDb.Speaker = step.Speaker;
                    }

                    if (fromDb.Text != step.Text)
                    {
                        fromDb.Text = step.Text;
                    }

                    if (fromDb.StepType != step.StepType)
                    {
                        fromDb.StepType = step.StepType;
                    }

                    if (!string.IsNullOrWhiteSpace(step.MediaUrl) && fromDb.MediaUrl != step.MediaUrl)
                    {
                        fromDb.MediaUrl = step.MediaUrl;
                    }

                    if (!string.IsNullOrWhiteSpace(step.ChoicesJson) && fromDb.ChoicesJson != step.ChoicesJson)
                    {
                        fromDb.ChoicesJson = step.ChoicesJson;
                    }
                }
            }

            dbContext.SaveChanges();
        }

        private static void LinkScenesToDefaultCourse(LuminoDbContext dbContext)
        {
            // link scenes to the default course (published first, otherwise any).
            // Safe to call multiple times.
            var defaultCourse = dbContext.Courses.FirstOrDefault(x => x.Title == "English A1")
                ?? dbContext.Courses.FirstOrDefault(x => x.IsPublished)
                ?? dbContext.Courses.FirstOrDefault();
            if (defaultCourse == null)
            {
                return;
            }

            var scenes = dbContext.Scenes.ToList();
            bool changed = false;

            foreach (var scene in scenes)
            {
                // do not overwrite if already linked
                if (scene.CourseId != null && scene.CourseId > 0)
                {
                    continue;
                }

                scene.CourseId = defaultCourse.Id;
                changed = true;
            }

            if (changed)
            {
                dbContext.SaveChanges();
            }
        }

        private static void SeedVocabulary(LuminoDbContext dbContext)
        {
            var items = VocabularySeederData.GetItems();

            var extraTranslationsByWord = VocabularySeederData.GetExtraTranslationsByWord();


            var fromDbList = dbContext.VocabularyItems.ToList();
            var fromDbMap = fromDbList
                .GroupBy(x => x.Word)
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

            foreach (var item in items)
            {
                var primaryTranslation = SplitTranslations(item.Translation).FirstOrDefault();

                if (string.IsNullOrWhiteSpace(primaryTranslation))
                {
                    primaryTranslation = item.Translation;
                }

                if (!fromDbMap.TryGetValue(item.Word, out var fromDb))
                {
                    dbContext.VocabularyItems.Add(new VocabularyItem
                    {
                        Word = item.Word,
                        Translation = primaryTranslation,
                        Example = item.Example,
                        PartOfSpeech = item.PartOfSpeech,
                        Definition = item.Definition,
                        Transcription = item.Transcription,
                        Gender = item.Gender,
                        ExamplesJson = item.ExamplesJson,
                        SynonymsJson = item.SynonymsJson,
                        IdiomsJson = item.IdiomsJson
                    });
                    continue;
                }

                if (fromDb.Translation != primaryTranslation)
                {
                    fromDb.Translation = primaryTranslation;
                }

                if (fromDb.Example != item.Example)
                {
                    fromDb.Example = item.Example;
                }

                if (fromDb.Transcription != item.Transcription)
                {
                    fromDb.Transcription = item.Transcription;
                }

                if (fromDb.Gender != item.Gender)
                {
                    fromDb.Gender = item.Gender;
                }

                if (fromDb.PartOfSpeech != item.PartOfSpeech)
                {
                    fromDb.PartOfSpeech = item.PartOfSpeech;
                }

                if (fromDb.Definition != item.Definition)
                {
                    fromDb.Definition = item.Definition;
                }

                if (fromDb.ExamplesJson != item.ExamplesJson)
                {
                    fromDb.ExamplesJson = item.ExamplesJson;
                }

                if (fromDb.SynonymsJson != item.SynonymsJson)
                {
                    fromDb.SynonymsJson = item.SynonymsJson;
                }

                if (fromDb.IdiomsJson != item.IdiomsJson)
                {
                    fromDb.IdiomsJson = item.IdiomsJson;
                }
            }

            dbContext.SaveChanges();

            UpsertVocabularyTranslations(dbContext, items, extraTranslationsByWord);
        }


        private static void UpsertVocabularyTranslations(
            LuminoDbContext dbContext,
            List<VocabularyItem> seededItems,
            Dictionary<string, List<string>> extraTranslationsByWord)
        {
            // 1) Мапа слово -> entity з БД
            var fromDbList = dbContext.VocabularyItems.ToList();
            var fromDbMap = fromDbList
                .GroupBy(x => x.Word)
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

            // 2) Існуючі переклади з БД
            var existing = dbContext.VocabularyItemTranslations.ToList();
            var existingByItemId = existing
                .GroupBy(x => x.VocabularyItemId)
                .ToDictionary(x => x.Key, x => x.OrderBy(t => t.Order).ToList());

            foreach (var seed in seededItems)
            {
                if (!fromDbMap.TryGetValue(seed.Word, out var entity))
                {
                    continue;
                }

                var desired = new List<string>();

                var baseTranslations = SplitTranslations(seed.Translation);

                if (baseTranslations.Count == 0 && !string.IsNullOrWhiteSpace(seed.Translation))
                {
                    baseTranslations.Add(seed.Translation.Trim());
                }

                foreach (var tr in baseTranslations)
                {
                    if (!string.IsNullOrWhiteSpace(tr))
                    {
                        desired.Add(tr.Trim());
                    }
                }

                if (extraTranslationsByWord.TryGetValue(seed.Word, out var extras))
                {
                    foreach (var tr in extras)
                    {
                        if (!string.IsNullOrWhiteSpace(tr))
                        {
                            desired.Add(tr.Trim());
                        }
                    }
                }

                // Унікалізація з збереженням порядку
                var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                desired = desired.Where(x => seen.Add(x)).ToList();

                if (desired.Count == 0)
                {
                    continue;
                }

                if (!existingByItemId.TryGetValue(entity.Id, out var current))
                {
                    current = new List<VocabularyItemTranslation>();
                    existingByItemId[entity.Id] = current;
                }

                // Видаляємо зайві (ті, яких немає у desired)
                var remove = current
                    .Where(x => !desired.Contains(x.Translation, StringComparer.OrdinalIgnoreCase))
                    .ToList();

                if (remove.Count > 0)
                {
                    dbContext.VocabularyItemTranslations.RemoveRange(remove);
                }

                // Після RemoveRange — працюємо лише з активними (не видаленими) рядками
                var active = current
                    .Where(x => !remove.Contains(x))
                    .ToList();

                // ВАЖЛИВО:
                // У нас є унікальні індекси:
                // 1) (VocabularyItemId, Order)
                // 2) (VocabularyItemId, Translation)
                // Якщо переклад "переїжджає" на інший Order (або міняється порядок),
                // то оновлення "по позиції" може на одну мить створити дублікати і впасти на SaveChanges().
                // Тому робимо безпечний 2-фазний апдейт:
                // - спочатку даємо всім існуючим перекладам тимчасові унікальні Order (негативні)
                // - зберігаємо
                // - потім виставляємо фінальні Order 1..N для desired і додаємо відсутні

                foreach (var row in active)
                {
                    // -Id гарантує унікальність в межах одного item
                    row.Order = -row.Id;
                }

                dbContext.SaveChanges();

                // Мапа translation -> рядок (для правильного "переміщення" перекладу між позиціями)
                var byTranslation = active
                    .GroupBy(x => x.Translation)
                    .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

                for (int i = 0; i < desired.Count; i++)
                {
                    var order = i + 1;
                    var tr = desired[i];

                    if (byTranslation.TryGetValue(tr, out var row))
                    {
                        row.Order = order;
                    }
                    else
                    {
                        var newRow = new VocabularyItemTranslation
                        {
                            VocabularyItemId = entity.Id,
                            Translation = tr,
                            Order = order
                        };

                        dbContext.VocabularyItemTranslations.Add(newRow);

                        active.Add(newRow);
                        byTranslation[tr] = newRow;
                    }
                }

                dbContext.SaveChanges();
            }
        }

        private static void SeedDemoContentEnglishOnly(LuminoDbContext dbContext)
        {
            var courseSeeds = LessonSeederData.GetCourses();
            Course? previousCourse = null;
            var courseMap = new Dictionary<string, Course>(StringComparer.OrdinalIgnoreCase);

            foreach (var seed in courseSeeds.OrderBy(x => x.Order))
            {
                var course = EnsureCourse(
                    dbContext,
                    title: seed.Title,
                    description: seed.Description,
                    languageCode: seed.LanguageCode,
                    isPublished: seed.IsPublished,
                    level: seed.Level,
                    order: seed.Order,
                    prerequisiteCourseId: previousCourse?.Id);

                courseMap[seed.Title] = course;
                previousCourse = course;
            }

            var courseEnglish = courseMap["English A1"];
            var courseEnglishA2 = courseMap["English A2"];
            var courseEnglishB1 = courseMap["English B1"];
            var courseEnglishB2 = courseMap["English B2"];
            var courseEnglishC1 = courseMap["English C1"];

            EnsurePrerequisitesForOrderedCourses(dbContext, languageCode: "en");

            var topics = LessonSeederData.GetTopics();
            var topicMap = EnsureTopics(dbContext, courseEnglish.Id, topics);

            var lessons = LessonSeederData.GetLessons(topicMap);
            var lessonMap = EnsureLessons(dbContext, lessons);

            var lessonExercises = LessonSeederData.GetLessonExercises();

            foreach (var lessonExercise in lessonExercises)
            {
                UpsertExercises(
                    dbContext,
                    lessonMap[LessonKey(topicMap[lessonExercise.TopicTitle].Id, lessonExercise.LessonTitle)].Id,
                    lessonExercise.Exercises);
            }

            EnsureFixedCourseStructureForDesign(dbContext, courseEnglish);
            EnsureFixedCourseStructureForDesign(dbContext, courseEnglishA2);
            EnsureFixedCourseStructureForDesign(dbContext, courseEnglishB1);
            EnsureFixedCourseStructureForDesign(dbContext, courseEnglishB2);
            EnsureFixedCourseStructureForDesign(dbContext, courseEnglishC1);
        }


        private static void EnsureFixedCourseStructureForDesign(LuminoDbContext dbContext, Course course)
        {
            if (course == null)
            {
                return;
            }

            // Design rule:
            // 1 course = 10 topics
            // 1 topic = 8 lessons + 1 final scene (sun)
            // 1 lesson = 9 exercises
            // This method is safe to call multiple times: it only adds missing items.

            var topicTitlesByOrder = new Dictionary<int, string>
            {
                [1] = "Basic words",
                [2] = "Simple sentences",
                [3] = "Travel",
                [4] = "Food & Cafe",
                [5] = "Topic 5",
                [6] = "Topic 6",
                [7] = "Topic 7",
                [8] = "Topic 8",
                [9] = "Topic 9",
                [10] = "Topic 10"
            };

            var topics = dbContext.Topics
                .Where(x => x.CourseId == course.Id)
                .OrderBy(x => x.Order)
                .ToList();

            var byOrder = topics
                .GroupBy(x => x.Order)
                .ToDictionary(x => x.Key, x => x.First());

            for (int topicOrder = 1; topicOrder <= 10; topicOrder++)
            {
                if (byOrder.TryGetValue(topicOrder, out var fromDb))
                {
                    if (topicTitlesByOrder.TryGetValue(topicOrder, out var desiredTitle))
                    {
                        if (!string.Equals(fromDb.Title, desiredTitle, StringComparison.Ordinal))
                        {
                            fromDb.Title = desiredTitle;
                        }
                    }

                    continue;
                }

                var topic = new Topic
                {
                    CourseId = course.Id,
                    Title = topicTitlesByOrder.TryGetValue(topicOrder, out var title) ? title : $"Topic {topicOrder}",
                    Order = topicOrder
                };

                dbContext.Topics.Add(topic);
            }

            dbContext.SaveChanges();

            topics = dbContext.Topics
                .Where(x => x.CourseId == course.Id)
                .OrderBy(x => x.Order)
                .ToList();

            foreach (var topic in topics)
            {
                EnsureLessonsForTopic(dbContext, topic);
                EnsureFinalSceneForTopic(dbContext, course, topic);
            }

            dbContext.SaveChanges();
        }

        private static void EnsureLessonsForTopic(LuminoDbContext dbContext, Topic topic)
        {
            var lessons = dbContext.Lessons
                .Where(x => x.TopicId == topic.Id)
                .OrderBy(x => x.Order)
                .ToList();

            var lessonOrders = lessons
                .Select(x => x.Order)
                .Distinct()
                .ToHashSet();

            for (int lessonOrder = 1; lessonOrder <= 8; lessonOrder++)
            {
                if (lessonOrders.Contains(lessonOrder))
                {
                    continue;
                }

                var lesson = new Lesson
                {
                    TopicId = topic.Id,
                    Title = $"{topic.Title} - Lesson {lessonOrder}",
                    Theory = "TBD",
                    Order = lessonOrder
                };

                dbContext.Lessons.Add(lesson);
            }

            dbContext.SaveChanges();

            lessons = dbContext.Lessons
                .Where(x => x.TopicId == topic.Id)
                .OrderBy(x => x.Order)
                .ToList();

            foreach (var lesson in lessons)
            {
                EnsureExercisesForLesson(dbContext, lesson);
            }
        }

        private static void EnsureExercisesForLesson(LuminoDbContext dbContext, Lesson lesson)
        {
            var exercises = dbContext.Exercises
                .Where(x => x.LessonId == lesson.Id)
                .OrderBy(x => x.Order)
                .ToList();

            var exerciseOrders = exercises
                .Select(x => x.Order)
                .Distinct()
                .ToHashSet();

            var placeholderOptions = ToJsonStringArray("Option A", "Option B", "Option C");

            for (int exOrder = 1; exOrder <= 9; exOrder++)
            {
                if (exerciseOrders.Contains(exOrder))
                {
                    continue;
                }

                var exercise = new Exercise
                {
                    LessonId = lesson.Id,
                    Type = ExerciseType.MultipleChoice,
                    Question = $"Placeholder question {exOrder}",
                    Data = placeholderOptions,
                    CorrectAnswer = "Option A",
                    Order = exOrder
                };

                dbContext.Exercises.Add(exercise);
            }
        }

        private static void EnsureFinalSceneForTopic(LuminoDbContext dbContext, Course course, Topic topic)
        {
            // One final scene ("Sun") per topic. It is used by LearningPath rules (TopicId != null).
            // IMPORTANT: We check exactly Sun, not "any scene", to avoid duplicates like:
            // - linked dialog scene (not Sun) + additionally created Sun.
            var existingForTopic = dbContext.Scenes.FirstOrDefault(x => x.CourseId == course.Id && x.TopicId == topic.Id);
            if (existingForTopic != null)
            {
                var desiredOrder = 1000 + topic.Order;

                if (!string.Equals(existingForTopic.SceneType, "Sun", StringComparison.Ordinal))
                {
                    existingForTopic.SceneType = "Sun";
                }

                if (existingForTopic.Order != desiredOrder)
                {
                    existingForTopic.Order = desiredOrder;
                }

                if (string.IsNullOrWhiteSpace(existingForTopic.Title))
                {
                    existingForTopic.Title = $"{topic.Title} - Sun";
                }

                if (string.IsNullOrWhiteSpace(existingForTopic.Description))
                {
                    existingForTopic.Description = "Final topic scene (sun)";
                }

                PopulateSunSceneFromTemplateIfNeeded(dbContext, existingForTopic, topic.Order);
                return;
            }

            var desiredTitle = GetSceneTemplateTitleByTopicOrder(topic.Order);

            if (!string.IsNullOrWhiteSpace(desiredTitle))
            {
                var fromDb = dbContext.Scenes.FirstOrDefault(x =>
                    x.Title == desiredTitle &&
                    x.CourseId == null &&
                    x.TopicId == null);
                if (fromDb != null)
                {
                    if (fromDb.CourseId != course.Id)
                    {
                        fromDb.CourseId = course.Id;
                    }

                    if (fromDb.TopicId != topic.Id)
                    {
                        fromDb.TopicId = topic.Id;
                    }

                    if (!string.Equals(fromDb.SceneType, "Sun", StringComparison.Ordinal))
                    {
                        fromDb.SceneType = "Sun";
                    }

                    // IMPORTANT: Scene.Order is unique per course (unique index CourseId + Order), so it must be unique across topics.
                    var desiredOrder = 1000 + topic.Order;
                    if (fromDb.Order != desiredOrder)
                    {
                        fromDb.Order = desiredOrder;
                    }

                    PopulateSunSceneFromTemplateIfNeeded(dbContext, fromDb, topic.Order);
                    return;
                }
            }

            var scene = new Scene
            {
                CourseId = course.Id,
                TopicId = topic.Id,
                Title = $"{topic.Title} - Sun",
                Description = "Final topic scene (sun)",
                SceneType = "Sun",
                BackgroundUrl = null,
                AudioUrl = null,
                // IMPORTANT: Scene.Order is unique per course (unique index CourseId + Order),
                // so we must keep it unique across topics.
                Order = 1000 + topic.Order
            };

            dbContext.Scenes.Add(scene);
            dbContext.SaveChanges();
            PopulateSunSceneFromTemplateIfNeeded(dbContext, scene, topic.Order);
        }

        private static string? GetSceneTemplateTitleByTopicOrder(int topicOrder)
        {
            return topicOrder switch
            {
                1 => "Cafe order",
                2 => "Airport check-in",
                3 => "Hotel booking",
                4 => "Asking directions",
                5 => "Shopping",
                6 => "Small talk",
                7 => "Restaurant reservation",
                8 => "Doctor visit",
                9 => "Public transport",
                10 => "Job interview",
                _ => null
            };
        }

        private static void PopulateSunSceneFromTemplateIfNeeded(LuminoDbContext dbContext, Scene scene, int topicOrder)
        {
            if (scene == null || scene.Id <= 0)
            {
                return;
            }

            var currentSteps = dbContext.SceneSteps
                .Where(x => x.SceneId == scene.Id)
                .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            if (currentSteps.Count > 0)
            {
                return;
            }

            var desiredTitle = GetSceneTemplateTitleByTopicOrder(topicOrder);
            if (string.IsNullOrWhiteSpace(desiredTitle))
            {
                return;
            }

            var templateScenes = dbContext.Scenes
                .Where(x => x.Id != scene.Id && x.Title == desiredTitle)
                .OrderBy(x => x.CourseId == null ? 0 : 1)
                .ThenBy(x => x.Id)
                .ToList();

            Scene? templateScene = null;
            List<SceneStep>? templateSteps = null;

            foreach (var candidate in templateScenes)
            {
                var candidateSteps = dbContext.SceneSteps
                    .Where(x => x.SceneId == candidate.Id)
                    .OrderBy(x => x.Order <= 0 ? int.MaxValue : x.Order)
                    .ThenBy(x => x.Id)
                    .ToList();

                if (candidateSteps.Count == 0)
                {
                    continue;
                }

                templateScene = candidate;
                templateSteps = candidateSteps;
                break;
            }

            if (templateScene == null || templateSteps == null || templateSteps.Count == 0)
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(scene.BackgroundUrl) && !string.IsNullOrWhiteSpace(templateScene.BackgroundUrl))
            {
                scene.BackgroundUrl = templateScene.BackgroundUrl;
            }

            if (string.IsNullOrWhiteSpace(scene.AudioUrl) && !string.IsNullOrWhiteSpace(templateScene.AudioUrl))
            {
                scene.AudioUrl = templateScene.AudioUrl;
            }

            if (string.IsNullOrWhiteSpace(scene.Description) || scene.Description == "Final topic scene (sun)")
            {
                scene.Description = templateScene.Description;
            }

            foreach (var step in templateSteps)
            {
                dbContext.SceneSteps.Add(new SceneStep
                {
                    SceneId = scene.Id,
                    Order = step.Order,
                    Speaker = step.Speaker,
                    Text = step.Text,
                    StepType = step.StepType,
                    MediaUrl = step.MediaUrl,
                    ChoicesJson = step.ChoicesJson
                });
            }
        }


        private static void SeedVocabularyLinks(LuminoDbContext dbContext)
        {
            SeedLessonVocabularyLinks(dbContext);
            SeedExerciseVocabularyLinks(dbContext);
        }

        private static void SeedLessonVocabularyLinks(LuminoDbContext dbContext)
        {
            var lessons = dbContext.Lessons.ToList();

            var vocabList = dbContext.VocabularyItems.ToList();
            var vocabMap = vocabList
                .GroupBy(x => NormalizeWord(x.Word))
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

            foreach (var lesson in lessons)
            {
                if (string.IsNullOrWhiteSpace(lesson.Theory))
                {
                    continue;
                }

                var lines = lesson.Theory
                    .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Trim())
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .ToList();

                bool hasPairs = lines.Any(x => x.Contains('='));

                if (!hasPairs)
                {
                    var words = TheoryVocabularyExtractor.ExtractNonPairWords(lesson.Theory);

                    foreach (var w in words)
                    {
                        var key = NormalizeWord(w);

                        if (string.IsNullOrWhiteSpace(key))
                        {
                            continue;
                        }

                        if (!vocabMap.TryGetValue(key, out var existing))
                        {
                            continue;
                        }

                        var exists = dbContext.LessonVocabularies
                            .Any(x => x.LessonId == lesson.Id && x.VocabularyItemId == existing.Id);

                        if (exists)
                        {
                            continue;
                        }

                        dbContext.LessonVocabularies.Add(new LessonVocabulary
                        {
                            LessonId = lesson.Id,
                            VocabularyItemId = existing.Id
                        });
                    }

                    continue;
                }

                foreach (var line in lines)
                {
                    if (!line.Contains('='))
                    {
                        continue;
                    }

                    var parts = line.Split('=', 2);
                    if (parts.Length != 2)
                    {
                        continue;
                    }

                    var word = NormalizeWord(parts[0]);
                    var translation = NormalizeWord(parts[1]);

                    if (string.IsNullOrWhiteSpace(word) || string.IsNullOrWhiteSpace(translation))
                    {
                        continue;
                    }

                    var item = EnsureVocabularyItem(dbContext, vocabMap, word, translation);

                    var exists = dbContext.LessonVocabularies
                        .Any(x => x.LessonId == lesson.Id && x.VocabularyItemId == item.Id);

                    if (exists)
                    {
                        continue;
                    }

                    dbContext.LessonVocabularies.Add(new LessonVocabulary
                    {
                        LessonId = lesson.Id,
                        VocabularyItemId = item.Id
                    });
                }

            }

            dbContext.SaveChanges();
        }

        private static void SeedExerciseVocabularyLinks(LuminoDbContext dbContext)
        {
            var exercises = dbContext.Exercises.ToList();

            var vocabList = dbContext.VocabularyItems.ToList();
            var vocabMap = vocabList
                .GroupBy(x => NormalizeWord(x.Word))
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

            foreach (var exercise in exercises)
            {
                if (exercise.Type == ExerciseType.Match)
                {
                    SeedMatchExerciseVocabularyLinks(dbContext, vocabMap, exercise);
                    continue;
                }

                if (TryExtractPairFromQuestion(exercise.Question, exercise.CorrectAnswer, out var pair))
                {
                    UpsertExerciseVocabularyLink(dbContext, vocabMap, exercise.Id, pair.Word, pair.Translation);
                }
            }

            dbContext.SaveChanges();
        }

        private static void SeedMatchExerciseVocabularyLinks(
            LuminoDbContext dbContext,
            Dictionary<string, VocabularyItem> vocabMap,
            Exercise exercise)
        {
            if (string.IsNullOrWhiteSpace(exercise.Data))
            {
                return;
            }

            List<MatchPair>? pairs;

            try
            {
                pairs = JsonSerializer.Deserialize<List<MatchPair>>(exercise.Data);
            }
            catch
            {
                return;
            }

            if (pairs == null || pairs.Count == 0)
            {
                return;
            }

            foreach (var p in pairs)
            {
                var word = NormalizeWord(p.left);
                var translation = NormalizeWord(p.right);

                if (string.IsNullOrWhiteSpace(word) || string.IsNullOrWhiteSpace(translation))
                {
                    continue;
                }

                UpsertExerciseVocabularyLink(dbContext, vocabMap, exercise.Id, word, translation);
            }
        }

        private static void UpsertExerciseVocabularyLink(
            LuminoDbContext dbContext,
            Dictionary<string, VocabularyItem> vocabMap,
            int exerciseId,
            string word,
            string translation)
        {
            var item = EnsureVocabularyItem(dbContext, vocabMap, word, translation);

            var exists = dbContext.ExerciseVocabularies
                .Any(x => x.ExerciseId == exerciseId && x.VocabularyItemId == item.Id);

            if (exists)
            {
                return;
            }

            dbContext.ExerciseVocabularies.Add(new ExerciseVocabulary
            {
                ExerciseId = exerciseId,
                VocabularyItemId = item.Id
            });
        }

        private static VocabularyItem EnsureVocabularyItem(
            LuminoDbContext dbContext,
            Dictionary<string, VocabularyItem> vocabMap,
            string word,
            string translation)
        {
            var translations = SplitTranslations(translation);

            if (translations.Count == 0)
            {
                translations.Add(translation);
            }

            var primary = translations[0];

            if (!vocabMap.TryGetValue(word, out var item))
            {
                item = dbContext.VocabularyItems
                    .AsEnumerable()
                    .FirstOrDefault(x => NormalizeWord(x.Word) == word);

                if (item == null)
                {
                    item = new VocabularyItem
                    {
                        Word = word,
                        Translation = primary,
                        Example = null
                    };

                    dbContext.VocabularyItems.Add(item);
                    dbContext.SaveChanges();

                    EnsureVocabularyTranslation(dbContext, item.Id, primary, makePrimary: true);

                    for (var i = 1; i < translations.Count; i++)
                    {
                        EnsureVocabularyTranslation(dbContext, item.Id, translations[i], makePrimary: false);
                    }

                    vocabMap[word] = item;

                    return item;
                }

                vocabMap[word] = item;
            }

            foreach (var t in translations)
            {
                EnsureVocabularyTranslation(dbContext, item.Id, t, makePrimary: false);
            }

            return item;
        }


        private static void EnsureVocabularyTranslation(
            LuminoDbContext dbContext,
            int vocabularyItemId,
            string translation,
            bool makePrimary)
        {
            translation = (translation ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(translation))
            {
                return;
            }

            var normalizedTranslation = NormalizeWord(translation);

            var existing = dbContext.VocabularyItemTranslations
                .AsEnumerable()
                .FirstOrDefault(x => x.VocabularyItemId == vocabularyItemId
                    && NormalizeWord(x.Translation) == normalizedTranslation);

            if (existing != null)
            {
                if (makePrimary && existing.Order != 0)
                {
                    MakeTranslationPrimary(dbContext, vocabularyItemId, existing.Id, translation);
                }

                return;
            }

            var list = dbContext.VocabularyItemTranslations
                .Where(x => x.VocabularyItemId == vocabularyItemId)
                .ToList();

            // When we just started using translations table, existing VocabularyItem.Translation must stay primary.
            // So first ensure base translation (Order = 0) from legacy field, then add extra translations.
            if (!makePrimary && list.Count == 0)
            {
                var item = dbContext.VocabularyItems.FirstOrDefault(x => x.Id == vocabularyItemId);
                var baseTranslation = (item?.Translation ?? string.Empty).Trim();

                if (!string.IsNullOrWhiteSpace(baseTranslation))
                {
                    dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
                    {
                        VocabularyItemId = vocabularyItemId,
                        Translation = baseTranslation,
                        Order = 0
                    });

                    dbContext.SaveChanges();

                    // refresh list after insert
                    list = dbContext.VocabularyItemTranslations
                        .Where(x => x.VocabularyItemId == vocabularyItemId)
                        .ToList();

                    if (string.Equals(NormalizeWord(baseTranslation), normalizedTranslation, StringComparison.OrdinalIgnoreCase))
                    {
                        return;
                    }
                }
            }

            if (makePrimary)
            {
                foreach (var t in list)
                {
                    t.Order += 1;
                }

                dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
                {
                    VocabularyItemId = vocabularyItemId,
                    Translation = translation,
                    Order = 0
                });

                var item = dbContext.VocabularyItems.FirstOrDefault(x => x.Id == vocabularyItemId);
                if (item != null && item.Translation != translation)
                {
                    item.Translation = translation;
                }

                dbContext.SaveChanges();
                return;
            }

            var nextOrder = list.Count == 0 ? 0 : (list.Max(x => x.Order) + 1);

            dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
            {
                VocabularyItemId = vocabularyItemId,
                Translation = translation,
                Order = nextOrder
            });

            dbContext.SaveChanges();
        }

        private static void MakeTranslationPrimary(
            LuminoDbContext dbContext,
            int vocabularyItemId,
            int translationId,
            string translationText)
        {
            var list = dbContext.VocabularyItemTranslations
                .Where(x => x.VocabularyItemId == vocabularyItemId)
                .OrderBy(x => x.Order)
                .ToList();

            if (list.Count == 0)
            {
                return;
            }

            var target = list.FirstOrDefault(x => x.Id == translationId);
            if (target == null)
            {
                return;
            }

            foreach (var t in list)
            {
                if (t.Id == target.Id)
                {
                    continue;
                }

                if (t.Order < target.Order)
                {
                    t.Order += 1;
                }
            }

            target.Order = 0;

            var item = dbContext.VocabularyItems.FirstOrDefault(x => x.Id == vocabularyItemId);
            if (item != null && item.Translation != translationText)
            {
                item.Translation = translationText;
            }

            dbContext.SaveChanges();
        }

        private static bool TryExtractPairFromQuestion(string question, string correctAnswer, out (string Word, string Translation) pair)
        {
            pair = default;

            question = question ?? string.Empty;
            correctAnswer = correctAnswer ?? string.Empty;

            if (string.IsNullOrWhiteSpace(question) || string.IsNullOrWhiteSpace(correctAnswer))
            {
                return false;
            }

            var q = question.Trim();

            if (q.Contains("= ?"))
            {
                var beforeEq = q.Split('=')[0].Trim();

                var word = NormalizeWord(beforeEq);
                var translation = NormalizeWord(correctAnswer);

                if (string.IsNullOrWhiteSpace(word) || string.IsNullOrWhiteSpace(translation))
                {
                    return false;
                }

                pair = (word, translation);
                return true;
            }

            if (q.StartsWith("Write", StringComparison.OrdinalIgnoreCase) && q.Contains(':'))
            {
                var idx = q.IndexOf(':');
                var part = q.Substring(idx + 1).Trim();

                if (string.IsNullOrWhiteSpace(part))
                {
                    return false;
                }

                var isEnglish = q.Contains("Write English", StringComparison.OrdinalIgnoreCase);

                var word = isEnglish ? NormalizeWord(correctAnswer) : NormalizeWord(part);
                var translation = isEnglish ? NormalizeWord(part) : NormalizeWord(correctAnswer);

                if (string.IsNullOrWhiteSpace(word) || string.IsNullOrWhiteSpace(translation))
                {
                    return false;
                }

                pair = (word, translation);
                return true;
            }

            if (!q.Contains("___")
                && !q.Contains("...")
                && !q.Contains("—")
                && !q.Contains(" - ")
                && !q.Contains(" = ")
                && q.Length <= 80)
            {
                var translationPrompt = q.Trim().TrimEnd('?', '!', '.', ':');
                var word = NormalizeWord(correctAnswer);
                var translation = NormalizeWord(translationPrompt);

                if (!string.IsNullOrWhiteSpace(word)
                    && !string.IsNullOrWhiteSpace(translation)
                    && !string.Equals(word, translation, StringComparison.OrdinalIgnoreCase))
                {
                    pair = (word, translation);
                    return true;
                }
            }

            return false;
        }

        private static string NormalizeWord(string value)
        {
            return (value ?? string.Empty).Trim().ToLowerInvariant();
        }

        private static List<string> SplitTranslations(string value)
        {
            value = (value ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(value))
            {
                return new List<string>();
            }

            // Support simple multi-translation formats:
            // "bank = банк / берег", "bank = банк, берег", "bank = банк; берег"
            // Keep order, remove duplicates (case-insensitive).
            value = value
                .Replace(" або ", "|", StringComparison.OrdinalIgnoreCase)
                .Replace(" or ", "|", StringComparison.OrdinalIgnoreCase);

            var parts = value
                .Split(new[] { '/', ',', ';', '|', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(x => (x ?? string.Empty).Trim())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToList();

            var result = new List<string>();

            foreach (var p in parts)
            {
                var normalized = NormalizeWord(p);

                if (string.IsNullOrWhiteSpace(normalized))
                {
                    continue;
                }

                if (!result.Any(x => string.Equals(NormalizeWord(x), normalized, StringComparison.OrdinalIgnoreCase)))
                {
                    result.Add(p);
                }
            }

            return result;
        }

        private static void EnsurePrerequisitesForOrderedCourses(LuminoDbContext dbContext, string languageCode)
        {
            if (string.IsNullOrWhiteSpace(languageCode))
            {
                return;
            }

            var normalized = languageCode.Trim().ToLowerInvariant();

            var courses = dbContext.Courses
                .Where(x => x.LanguageCode == normalized && x.Order > 0)
                .OrderBy(x => x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            if (courses.Count < 2)
            {
                return;
            }

            var changed = false;
            Course? previous = null;

            foreach (var c in courses)
            {
                if (previous == null)
                {
                    previous = c;
                    continue;
                }

                if (c.PrerequisiteCourseId == null)
                {
                    c.PrerequisiteCourseId = previous.Id;
                    changed = true;
                }

                previous = c;
            }

            if (changed)
            {
                dbContext.SaveChanges();
            }
        }


        private static Course EnsureCourse(LuminoDbContext dbContext, string title, string description, string languageCode, bool isPublished, string? level, int order, int? prerequisiteCourseId)
        {
            var fromDb = dbContext.Courses.FirstOrDefault(x => x.Title == title);

            if (fromDb == null)
            {
                var course = new Course
                {
                    Title = title,
                    Description = description,
                    LanguageCode = (languageCode ?? "en").Trim().ToLowerInvariant(),
                    Level = string.IsNullOrWhiteSpace(level) ? null : level.Trim().ToUpperInvariant(),
                    Order = order,
                    PrerequisiteCourseId = prerequisiteCourseId,
                    IsPublished = isPublished
                };

                dbContext.Courses.Add(course);
                dbContext.SaveChanges();

                return course;
            }

            var changed = false;

            if (fromDb.Description != description)
            {
                fromDb.Description = description;
                changed = true;
            }

            var normalizedLanguageCode = (languageCode ?? "en").Trim().ToLowerInvariant();

            if (fromDb.LanguageCode != normalizedLanguageCode)
            {
                fromDb.LanguageCode = normalizedLanguageCode;
                changed = true;
            }

            var normalizedLevel = string.IsNullOrWhiteSpace(level) ? null : level.Trim().ToUpperInvariant();

            if (fromDb.Level != normalizedLevel)
            {
                fromDb.Level = normalizedLevel;
                changed = true;
            }

            if (fromDb.Order != order)
            {
                fromDb.Order = order;
                changed = true;
            }

            if (fromDb.PrerequisiteCourseId != prerequisiteCourseId)
            {
                fromDb.PrerequisiteCourseId = prerequisiteCourseId;
                changed = true;
            }


            if (fromDb.IsPublished != isPublished)
            {
                fromDb.IsPublished = isPublished;
                changed = true;
            }

            if (changed)
            {
                dbContext.SaveChanges();
            }

            return fromDb;
        }

        private static Dictionary<string, Topic> EnsureTopics(
            LuminoDbContext dbContext,
            int courseId,
            List<TopicSeed> seeds)
        {
            var fromDbList = dbContext.Topics
                .Where(x => x.CourseId == courseId)
                .ToList();

            var fromDbMap = fromDbList
                .GroupBy(x => x.Title)
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

            var fromDbOrderMap = fromDbList
                .GroupBy(x => x.Order)
                .ToDictionary(x => x.Key, x => x.First());

            foreach (var seed in seeds)
            {
                if (!fromDbMap.TryGetValue(seed.Title, out var fromDb))
                {
                    if (fromDbOrderMap.TryGetValue(seed.Order, out var fromDbByOrder))
                    {
                        if (fromDbByOrder.Title != seed.Title)
                        {
                            fromDbByOrder.Title = seed.Title;
                        }

                        fromDb = fromDbByOrder;
                    }
                    else
                    {
                        var topic = new Topic
                        {
                            CourseId = courseId,
                            Title = seed.Title,
                            Order = seed.Order
                        };

                        dbContext.Topics.Add(topic);
                        continue;
                    }
                }

                if (fromDb.Order != seed.Order)
                {
                    fromDb.Order = seed.Order;
                }
            }

            dbContext.SaveChanges();

            return dbContext.Topics
                .Where(x => x.CourseId == courseId)
                .ToList()
                .GroupBy(x => x.Title)
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);
        }

        private static Dictionary<string, Lesson> EnsureLessons(LuminoDbContext dbContext, List<LessonSeed> seeds)
        {
            var topicIds = seeds
                .Select(x => x.TopicId)
                .Distinct()
                .ToList();

            var fromDbList = dbContext.Lessons
                .Where(x => topicIds.Contains(x.TopicId))
                .ToList();

            var fromDbMap = fromDbList
                .GroupBy(x => $"{x.TopicId}:{x.Title}", StringComparer.OrdinalIgnoreCase)
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

            var fromDbOrderMap = fromDbList
                .GroupBy(x => $"{x.TopicId}:{x.Order}")
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

            foreach (var seed in seeds)
            {
                var key = $"{seed.TopicId}:{seed.Title}";

                if (!fromDbMap.TryGetValue(key, out var fromDb))
                {
                    var orderKey = $"{seed.TopicId}:{seed.Order}";

                    if (fromDbOrderMap.TryGetValue(orderKey, out var fromDbByOrder))
                    {
                        if (fromDbByOrder.Title != seed.Title)
                        {
                            fromDbByOrder.Title = seed.Title;
                        }

                        fromDb = fromDbByOrder;
                    }
                    else
                    {
                        var lesson = new Lesson
                        {
                            TopicId = seed.TopicId,
                            Title = seed.Title,
                            Theory = seed.Theory,
                            Order = seed.Order
                        };

                        dbContext.Lessons.Add(lesson);
                        continue;
                    }
                }

                if (fromDb.Theory != seed.Theory)
                {
                    fromDb.Theory = seed.Theory;
                }

                if (fromDb.Order != seed.Order)
                {
                    fromDb.Order = seed.Order;
                }
            }

            dbContext.SaveChanges();

            return dbContext.Lessons
                .Where(x => topicIds.Contains(x.TopicId))
                .ToList()
                .GroupBy(x => LessonKey(x.TopicId, x.Title), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);
        }

        private static string LessonKey(int topicId, string title)
        {
            return $"{topicId}:{title}";
        }

        private static void UpsertExercises(LuminoDbContext dbContext, int lessonId, List<ExerciseSeed> seeds)
        {
            var fromDbList = dbContext.Exercises
                .Where(x => x.LessonId == lessonId)
                .ToList();

            var fromDbMap = fromDbList
                .GroupBy(x => x.Order)
                .ToDictionary(x => x.Key, x => x.First());

            foreach (var seed in seeds.OrderBy(x => x.Order))
            {
                if (!fromDbMap.TryGetValue(seed.Order, out var fromDb))
                {
                    var exercise = new Exercise
                    {
                        LessonId = lessonId,
                        Type = seed.Type,
                        Question = seed.Question,
                        Data = seed.Data,
                        CorrectAnswer = seed.CorrectAnswer,
                        Order = seed.Order,
                        ImageUrl = seed.ImageUrl
                    };

                    dbContext.Exercises.Add(exercise);
                    continue;
                }

                if (fromDb.Type != seed.Type)
                {
                    fromDb.Type = seed.Type;
                }

                if (fromDb.Question != seed.Question)
                {
                    fromDb.Question = seed.Question;
                }

                if (fromDb.Data != seed.Data)
                {
                    fromDb.Data = seed.Data;
                }

                if (fromDb.CorrectAnswer != seed.CorrectAnswer)
                {
                    fromDb.CorrectAnswer = seed.CorrectAnswer;
                }

                if (fromDb.ImageUrl != seed.ImageUrl)
                {
                    fromDb.ImageUrl = seed.ImageUrl;
                }
            }

            dbContext.SaveChanges();
        }

        private static string ToJsonStringArray(params string[] items)
        {
            return JsonSerializer.Serialize(items);
        }

        private static string ToJsonRelationArray(params (string Word, string Translation)[] items)
        {
            var data = items
                .Select(x => new VocabularyRelationDto
                {
                    Word = x.Word,
                    Translation = x.Translation
                })
                .ToList();

            return JsonSerializer.Serialize(data);
        }

        private static string ToJsonMatchPairs(params (string Left, string Right)[] pairs)
        {
            var data = pairs
                .Select(x => new MatchPair { left = x.Left, right = x.Right })
                .ToList();

            return JsonSerializer.Serialize(data);
        }

        private class MatchPair
        {
            public string left { get; set; } = null!;
            public string right { get; set; } = null!;
        }

        private static void EnsureStrictCourseStructure(LuminoDbContext dbContext, int courseId)
        {
            // This is our content pipeline rule for UI: 1 course = 10 topics, 1 topic = 8 lessons, 1 lesson = 9 exercises.
            // Seeder makes it true for the default demo course too.
            var topics = dbContext.Topics
                .Where(x => x.CourseId == courseId)
                .OrderBy(x => x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            if (topics.Count < 10)
            {
                var startOrder = topics.Count == 0 ? 1 : topics.Max(x => x.Order) + 1;

                for (int i = topics.Count + 1; i <= 10; i++)
                {
                    dbContext.Topics.Add(new Topic
                    {
                        CourseId = courseId,
                        Title = $"Topic {i}",
                        Order = startOrder++
                    });
                }

                dbContext.SaveChanges();

                topics = dbContext.Topics
                    .Where(x => x.CourseId == courseId)
                    .OrderBy(x => x.Order)
                    .ThenBy(x => x.Id)
                    .ToList();
            }

            foreach (var topic in topics.Take(10))
            {
                EnsureLessonsForTopic(dbContext, topic.Id, topic.Order);
            }
        }

        private static void EnsureLessonsForTopic(LuminoDbContext dbContext, int topicId, int topicOrder)
        {
            var lessons = dbContext.Lessons
                .Where(x => x.TopicId == topicId)
                .OrderBy(x => x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            if (lessons.Count < 8)
            {
                var startOrder = lessons.Count == 0 ? 1 : lessons.Max(x => x.Order) + 1;

                for (int i = lessons.Count + 1; i <= 8; i++)
                {
                    dbContext.Lessons.Add(new Lesson
                    {
                        TopicId = topicId,
                        Title = $"Topic {topicOrder} — Lesson {i}",
                        Theory = "Coming soon",
                        Order = startOrder++
                    });
                }

                dbContext.SaveChanges();

                lessons = dbContext.Lessons
                    .Where(x => x.TopicId == topicId)
                    .OrderBy(x => x.Order)
                    .ThenBy(x => x.Id)
                    .ToList();
            }

            foreach (var lesson in lessons.Take(8))
            {
                EnsureExercisesForLesson(dbContext, lesson.Id);
            }
        }

        private static void EnsureExercisesForLesson(LuminoDbContext dbContext, int lessonId)
        {
            var exercises = dbContext.Exercises
                .Where(x => x.LessonId == lessonId)
                .OrderBy(x => x.Order)
                .ThenBy(x => x.Id)
                .ToList();

            if (exercises.Count >= 9)
            {
                return;
            }

            var startOrder = exercises.Count == 0 ? 1 : exercises.Max(x => x.Order) + 1;

            for (int i = exercises.Count + 1; i <= 9; i++)
            {
                dbContext.Exercises.Add(new Exercise
                {
                    LessonId = lessonId,
                    Type = ExerciseType.MultipleChoice,
                    Question = $"Demo question {i}",
                    Data = ToJsonStringArray("Option A", "Option B", "Option C"),
                    CorrectAnswer = "Option A",
                    Order = startOrder++
                });
            }

            dbContext.SaveChanges();
        }
        private static void EnsureVocabularyBaseTranslations(LuminoDbContext dbContext)
        {
            var items = dbContext.VocabularyItems
                .AsNoTracking()
                .Select(x => new { x.Id, x.Translation })
                .ToList();

            if (items.Count == 0)
            {
                return;
            }

            var translations = dbContext.VocabularyItemTranslations
                .ToList();

            var byItem = translations
                .GroupBy(x => x.VocabularyItemId)
                .ToDictionary(x => x.Key, x => x.ToList());

            var hasChanges = false;

            foreach (var vi in items)
            {
                if (!byItem.TryGetValue(vi.Id, out var list) || list.Count == 0)
                {
                    dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
                    {
                        VocabularyItemId = vi.Id,
                        Translation = vi.Translation,
                        Order = 0
                    });

                    hasChanges = true;
                    continue;
                }

                var primary = list.OrderBy(x => x.Order).FirstOrDefault(x => x.Order == 0);
                if (primary == null)
                {
                    var minOrder = list.Min(x => x.Order);
                    primary = list.First(x => x.Order == minOrder);
                    primary.Order = 0;
                    hasChanges = true;
                }

                if (!string.Equals(primary.Translation, vi.Translation, StringComparison.Ordinal))
                {
                    primary.Translation = vi.Translation;
                    hasChanges = true;
                }
            }

            if (hasChanges)
            {
                dbContext.SaveChanges();
            }
        }

    }
}
