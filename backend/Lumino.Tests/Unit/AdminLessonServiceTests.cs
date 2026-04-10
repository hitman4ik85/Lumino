using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Xunit;

namespace Lumino.Tests;

public class AdminLessonServiceTests
{
    [Fact]
    public void GetByTopic_ReturnsOrderedByOrder()
    {
        var dbContext = TestDbContextFactory.Create();

        var topic = new Topic
        {
            CourseId = 1,
            Title = "Topic",
            Order = 1
        };

        dbContext.Topics.Add(topic);
        dbContext.SaveChanges();

        var lesson1 = new Lesson { TopicId = topic.Id, Title = "L1", Theory = "T1", Order = 2 };
        var lesson2 = new Lesson { TopicId = topic.Id, Title = "L2", Theory = "T2", Order = 1 };
        var lesson3 = new Lesson { TopicId = topic.Id, Title = "L3", Theory = "T3", Order = 3 };

        dbContext.Lessons.AddRange(lesson1, lesson2, lesson3);

        dbContext.SaveChanges();

        var service = new AdminLessonService(dbContext);

        var result = service.GetByTopic(topic.Id);

        Assert.Equal(3, result.Count);
        Assert.Equal(1, result[0].Order);
        Assert.Equal(2, result[1].Order);
        Assert.Equal(3, result[2].Order);
        Assert.Equal("L2", result[0].Title);
        Assert.Equal("L1", result[1].Title);
        Assert.Equal("L3", result[2].Title);
    }

    [Fact]
    public void Create_AddsLesson_AndReturnsResponse()
    {
        var dbContext = TestDbContextFactory.Create();

        var topic = new Topic
        {
            CourseId = 1,
            Title = "Topic",
            Order = 1
        };

        dbContext.Topics.Add(topic);

        dbContext.SaveChanges();

        var service = new AdminLessonService(dbContext);

        var response = service.Create(new CreateLessonRequest
        {
            TopicId = topic.Id,
            Title = "Lesson",
            Theory = "Theory",
            Order = 1
        });

        Assert.True(response.Id > 0);
        Assert.Equal(topic.Id, response.TopicId);
        Assert.Equal("Lesson", response.Title);
        Assert.Equal("Theory", response.Theory);
        Assert.Equal(1, response.Order);

        var saved = dbContext.Lessons.FirstOrDefault(x => x.Id == response.Id);
        Assert.NotNull(saved);
        Assert.Equal(topic.Id, saved!.TopicId);
        Assert.Equal("Lesson", saved.Title);
        Assert.Equal("Theory", saved.Theory);
        Assert.Equal(1, saved.Order);
    }

    [Fact]
    public void Create_NullRequest_Throws()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new AdminLessonService(dbContext);

        Assert.Throws<ArgumentException>(() => service.Create(null!));
    }

    [Fact]
    public void Update_WhenNotFound_Throws()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new AdminLessonService(dbContext);

        Assert.Throws<KeyNotFoundException>(() =>
        {
            service.Update(999, new UpdateLessonRequest
            {
                Title = "New",
                Theory = "NewTheory",
                Order = 2
            });
        });
    }

    [Fact]
    public void Update_UpdatesFields()
    {
        var dbContext = TestDbContextFactory.Create();

        var topic = new Topic
        {
            CourseId = 1,
            Title = "Topic",
            Order = 1
        };

        dbContext.Topics.Add(topic);
        dbContext.SaveChanges();

        var lesson = new Lesson
        {
            TopicId = topic.Id,
            Title = "Old",
            Theory = "OldTheory",
            Order = 1
        };

        dbContext.Lessons.Add(lesson);

        dbContext.SaveChanges();

        var service = new AdminLessonService(dbContext);

        service.Update(lesson.Id, new UpdateLessonRequest
        {
            Title = "New",
            Theory = "NewTheory",
            Order = 2
        });

        var updated = dbContext.Lessons.First(x => x.Id == lesson.Id);

        Assert.Equal("New", updated.Title);
        Assert.Equal("NewTheory", updated.Theory);
        Assert.Equal(2, updated.Order);
    }

    [Fact]
    public void Delete_WhenNotFound_Throws()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new AdminLessonService(dbContext);

        Assert.Throws<KeyNotFoundException>(() => service.Delete(999));
    }

    [Fact]
    public void Delete_RemovesLesson()
    {
        var dbContext = TestDbContextFactory.Create();

        var topic = new Topic
        {
            CourseId = 1,
            Title = "Topic",
            Order = 1
        };

        dbContext.Topics.Add(topic);
        dbContext.SaveChanges();

        var lesson = new Lesson
        {
            TopicId = topic.Id,
            Title = "ToDelete",
            Theory = "T",
            Order = 1
        };

        dbContext.Lessons.Add(lesson);

        dbContext.SaveChanges();

        var service = new AdminLessonService(dbContext);

        service.Delete(lesson.Id);

        Assert.Empty(dbContext.Lessons);
    }
    [Fact]
    public void Create_WhenOrderDuplicateInTopic_Throws()
    {
        var dbContext = TestDbContextFactory.Create();

        var topic = new Topic
        {
            CourseId = 1,
            Title = "Topic",
            Order = 1
        };

        dbContext.Topics.Add(topic);
        dbContext.SaveChanges();

        dbContext.Lessons.Add(new Lesson
        {
            TopicId = topic.Id,
            Title = "L1",
            Theory = "T1",
            Order = 1
        });

        dbContext.SaveChanges();

        var service = new AdminLessonService(dbContext);

        Assert.Throws<ArgumentException>(() => service.Create(new CreateLessonRequest
        {
            TopicId = topic.Id,
            Title = "L2",
            Theory = "T2",
            Order = 1
        }));
    }

    [Fact]
    public void Create_WhenOrderIsNegative_NormalizesToZero()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new AdminLessonService(dbContext);

        var topic = new Topic
        {
            CourseId = 1,
            Title = "Topic",
            Order = 1
        };

        dbContext.Topics.Add(topic);
        dbContext.SaveChanges();

        var created = service.Create(new CreateLessonRequest
        {
            TopicId = topic.Id,
            Title = "L",
            Theory = "T",
            Order = -10
        });

        var lesson = dbContext.Lessons.First(x => x.Id == created.Id);

        Assert.Equal(0, lesson.Order);
    }

    [Fact]
    public void Update_WhenOrderDuplicateInTopic_Throws()
    {
        var dbContext = TestDbContextFactory.Create();

        var topic = new Topic
        {
            CourseId = 1,
            Title = "Topic",
            Order = 1
        };

        dbContext.Topics.Add(topic);
        dbContext.SaveChanges();

        var lesson1 = new Lesson
        {
            TopicId = topic.Id,
            Title = "L1",
            Theory = "T1",
            Order = 1
        };

        var lesson2 = new Lesson
        {
            TopicId = topic.Id,
            Title = "L2",
            Theory = "T2",
            Order = 2
        };

        dbContext.Lessons.AddRange(lesson1, lesson2);

        dbContext.SaveChanges();

        var service = new AdminLessonService(dbContext);

        Assert.Throws<ArgumentException>(() => service.Update(lesson2.Id, new UpdateLessonRequest
        {
            Title = "L2",
            Theory = "T2",
            Order = 1
        }));
    }

    [Fact]
    public void Copy_CreatesNewLesson_WithExercises_AndVocabularyLinks()
    {
        var dbContext = TestDbContextFactory.Create();

        var course = new Course { Title = "C", LanguageCode = "en", IsPublished = true };
        dbContext.Courses.Add(course);
        dbContext.SaveChanges();

        var topic = new Topic { CourseId = course.Id, Title = "Topic", Order = 1 };
        dbContext.Topics.Add(topic);
        dbContext.SaveChanges();

        var lesson = new Lesson { TopicId = topic.Id, Title = "L1", Theory = "T1", Order = 1 };
        dbContext.Lessons.Add(lesson);
        dbContext.SaveChanges();

        dbContext.Exercises.AddRange(
            new Exercise { LessonId = lesson.Id, Type = Lumino.Api.Domain.Enums.ExerciseType.Input, Question = "Q1", Data = "{}", CorrectAnswer = "a", Order = 1 },
            new Exercise { LessonId = lesson.Id, Type = Lumino.Api.Domain.Enums.ExerciseType.MultipleChoice, Question = "Q2", Data = "[\"a\",\"b\"]", CorrectAnswer = "a", Order = 2 }
        );

        var vocab = new VocabularyItem { Word = "cat", Translation = "кіт", Example = "cat" };
        dbContext.VocabularyItems.Add(vocab);
        dbContext.SaveChanges();

        dbContext.LessonVocabularies.Add(new LessonVocabulary { LessonId = lesson.Id, VocabularyItemId = vocab.Id });
        dbContext.SaveChanges();

        var service = new AdminLessonService(dbContext);

        var copied = service.Copy(lesson.Id, new CopyItemRequest { TitleSuffix = " (Copy)" });

        Assert.NotEqual(lesson.Id, copied.Id);
        Assert.Equal(topic.Id, copied.TopicId);
        Assert.Equal("L1 (Copy)", copied.Title);

        Assert.Equal(2, copied.ExercisesCount);
        Assert.Single(copied.Vocabulary);
        Assert.Equal(vocab.Id, copied.Vocabulary[0].Id);

        var copiedExercises = dbContext.Exercises.Where(x => x.LessonId == copied.Id).ToList();
        Assert.Equal(2, copiedExercises.Count);

        var copiedLinks = dbContext.LessonVocabularies.Where(x => x.LessonId == copied.Id).ToList();
        Assert.Single(copiedLinks);
        Assert.Equal(vocab.Id, copiedLinks[0].VocabularyItemId);
    }

    [Fact]
    public void Copy_WhenTargetTopicHasGap_UsesFirstFreeOrder()
    {
        var dbContext = TestDbContextFactory.Create();

        var topic1 = new Topic { CourseId = 1, Title = "Topic 1", Order = 1 };
        var topic2 = new Topic { CourseId = 1, Title = "Topic 2", Order = 2 };
        dbContext.Topics.AddRange(topic1, topic2);
        dbContext.SaveChanges();

        var sourceLesson = new Lesson
        {
            TopicId = topic1.Id,
            Title = "Source",
            Theory = "T",
            Order = 1
        };

        dbContext.Lessons.Add(sourceLesson);
        dbContext.Lessons.AddRange(
            new Lesson { TopicId = topic2.Id, Title = "L1", Theory = "T", Order = 1 },
            new Lesson { TopicId = topic2.Id, Title = "L3", Theory = "T", Order = 3 }
        );
        dbContext.SaveChanges();

        var service = new AdminLessonService(dbContext);

        var copied = service.Copy(sourceLesson.Id, new CopyItemRequest
        {
            TargetTopicId = topic2.Id
        });

        Assert.Equal(2, copied.Order);
    }

    [Fact]
    public void ExportExercises_ReturnsExercisesOrdered()
    {
        var dbContext = TestDbContextFactory.Create();

        var topic = new Topic { CourseId = 1, Title = "Topic", Order = 1 };
        dbContext.Topics.Add(topic);
        dbContext.SaveChanges();

        var lesson = new Lesson { TopicId = topic.Id, Title = "L1", Theory = "T1", Order = 1 };
        dbContext.Lessons.Add(lesson);
        dbContext.SaveChanges();

        dbContext.Exercises.AddRange(
            new Exercise { LessonId = lesson.Id, Type = Lumino.Api.Domain.Enums.ExerciseType.Input, Question = "Q2", Data = "{}", CorrectAnswer = "a", Order = 2, ImageUrl = "/uploads/q2.png" },
            new Exercise { LessonId = lesson.Id, Type = Lumino.Api.Domain.Enums.ExerciseType.Input, Question = "Q1", Data = "{}", CorrectAnswer = "a", Order = 1, ImageUrl = "/uploads/q1.png" }
        );
        dbContext.SaveChanges();

        var service = new AdminLessonService(dbContext);

        var exported = service.ExportExercises(lesson.Id);

        Assert.Equal(2, exported.Count);
        Assert.Equal(1, exported[0].Order);
        Assert.Equal("Q1", exported[0].Question);
        Assert.Equal("/uploads/q1.png", exported[0].ImageUrl);
        Assert.Equal(2, exported[1].Order);
        Assert.Equal("Q2", exported[1].Question);
    }

    [Fact]
    public void ImportExercises_WithReplaceExisting_ReplacesExercises()
    {
        var dbContext = TestDbContextFactory.Create();

        var topic = new Topic { CourseId = 1, Title = "Topic", Order = 1 };
        dbContext.Topics.Add(topic);
        dbContext.SaveChanges();

        var lesson = new Lesson { TopicId = topic.Id, Title = "L1", Theory = "T1", Order = 1 };
        dbContext.Lessons.Add(lesson);
        dbContext.SaveChanges();

        dbContext.Exercises.Add(new Exercise
        {
            LessonId = lesson.Id,
            Type = Lumino.Api.Domain.Enums.ExerciseType.Input,
            Question = "Old",
            Data = "{}",
            CorrectAnswer = "old",
            Order = 1
        });

        dbContext.SaveChanges();

        var service = new AdminLessonService(dbContext);

        var result = service.ImportExercises(lesson.Id, new ImportExercisesRequest
        {
            ReplaceExisting = true,
            Exercises = new()
            {
                new ExportExerciseJson
                {
                    Type = "Input",
                    Question = "New1",
                    Data = "{}",
                    CorrectAnswer = "a",
                    Order = 1,
                    ImageUrl = "/uploads/new1.png"
                },
                new ExportExerciseJson
                {
                    Type = "MultipleChoice",
                    Question = "New2",
                    Data = "[\"a\",\"b\"]",
                    CorrectAnswer = "a",
                    Order = 2,
                    ImageUrl = "/uploads/new2.png"
                }
            }
        });

        Assert.Equal(2, result.ExercisesCount);

        var saved = dbContext.Exercises.Where(x => x.LessonId == lesson.Id).OrderBy(x => x.Order).ToList();
        Assert.Equal(2, saved.Count);
        Assert.Equal("New1", saved[0].Question);
        Assert.Equal("/uploads/new1.png", saved[0].ImageUrl);
        Assert.Equal("New2", saved[1].Question);
        Assert.Equal("/uploads/new2.png", saved[1].ImageUrl);
    }


    [Fact]
    public void Create_WhenTopicAlreadyHasEightLessons_Throws()
    {
        var dbContext = TestDbContextFactory.Create();

        var topic = new Topic { CourseId = 1, Title = "Topic", Order = 1 };
        dbContext.Topics.Add(topic);
        dbContext.SaveChanges();

        for (int i = 1; i <= 8; i++)
        {
            dbContext.Lessons.Add(new Lesson
            {
                TopicId = topic.Id,
                Title = $"L{i}",
                Theory = "T",
                Order = i
            });
        }

        dbContext.SaveChanges();

        var service = new AdminLessonService(dbContext);

        var ex = Assert.Throws<ArgumentException>(() => service.Create(new CreateLessonRequest
        {
            TopicId = topic.Id,
            Title = "L9",
            Theory = "T",
            Order = 0
        }));

        Assert.Contains("at most 8 lessons", ex.Message);
    }

    [Fact]
    public void Copy_WhenTargetTopicAlreadyHasEightLessons_Throws()
    {
        var dbContext = TestDbContextFactory.Create();

        var topic1 = new Topic { CourseId = 1, Title = "Topic 1", Order = 1 };
        var topic2 = new Topic { CourseId = 1, Title = "Topic 2", Order = 2 };
        dbContext.Topics.AddRange(topic1, topic2);
        dbContext.SaveChanges();

        var sourceLesson = new Lesson
        {
            TopicId = topic1.Id,
            Title = "Source",
            Theory = "T",
            Order = 1
        };

        dbContext.Lessons.Add(sourceLesson);

        for (int i = 1; i <= 8; i++)
        {
            dbContext.Lessons.Add(new Lesson
            {
                TopicId = topic2.Id,
                Title = $"L{i}",
                Theory = "T",
                Order = i
            });
        }

        dbContext.SaveChanges();

        var service = new AdminLessonService(dbContext);

        var ex = Assert.Throws<ArgumentException>(() => service.Copy(sourceLesson.Id, new CopyItemRequest
        {
            TargetTopicId = topic2.Id
        }));

        Assert.Contains("at most 8 lessons", ex.Message);
    }

    [Fact]
    public void Create_WhenOrderGreaterThanEight_Throws()
    {
        var dbContext = TestDbContextFactory.Create();

        var topic = new Topic { CourseId = 1, Title = "Topic", Order = 1 };
        dbContext.Topics.Add(topic);
        dbContext.SaveChanges();

        var service = new AdminLessonService(dbContext);

        var ex = Assert.Throws<ArgumentException>(() => service.Create(new CreateLessonRequest
        {
            TopicId = topic.Id,
            Title = "L9",
            Theory = "T",
            Order = 9
        }));

        Assert.Contains("between 1 and 8", ex.Message);
    }

}
