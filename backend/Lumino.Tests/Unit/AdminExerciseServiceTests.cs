using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Xunit;

namespace Lumino.Tests;

public class AdminExerciseServiceTests
{
    [Fact]
    public void Create_MultipleChoice_InvalidJson_ShouldThrow()
    {
        var dbContext = TestDbContextFactory.Create();
        SeedLesson(dbContext);

        var service = new AdminExerciseService(dbContext);

        Assert.Throws<ArgumentException>(() =>
        {
            service.Create(new CreateExerciseRequest
            {
                LessonId = 1,
                Type = "MultipleChoice",
                Question = "Q",
                Data = "NOT_JSON",
                CorrectAnswer = "A",
                Order = 1
            });
        });
    }

    [Fact]
    public void Create_MultipleChoice_CorrectAnswerNotInOptions_ShouldThrow()
    {
        var dbContext = TestDbContextFactory.Create();
        SeedLesson(dbContext);

        var service = new AdminExerciseService(dbContext);

        Assert.Throws<ArgumentException>(() =>
        {
            service.Create(new CreateExerciseRequest
            {
                LessonId = 1,
                Type = "MultipleChoice",
                Question = "Q",
                Data = "[\"A\",\"B\"]",
                CorrectAnswer = "C",
                Order = 1
            });
        });
    }

    [Fact]
    public void Create_Match_InvalidJson_ShouldThrow()
    {
        var dbContext = TestDbContextFactory.Create();
        SeedLesson(dbContext);

        var service = new AdminExerciseService(dbContext);

        Assert.Throws<ArgumentException>(() =>
        {
            service.Create(new CreateExerciseRequest
            {
                LessonId = 1,
                Type = "Match",
                Question = "Q",
                Data = "NOT_JSON",
                CorrectAnswer = "{}",
                Order = 1
            });
        });
    }

    [Fact]
    public void Create_Match_DuplicateLeft_ShouldThrow()
    {
        var dbContext = TestDbContextFactory.Create();
        SeedLesson(dbContext);

        var service = new AdminExerciseService(dbContext);

        Assert.Throws<ArgumentException>(() =>
        {
            service.Create(new CreateExerciseRequest
            {
                LessonId = 1,
                Type = "Match",
                Question = "Q",
                Data = "[{ \"left\": \"cat\", \"right\": \"кіт\" },{ \"left\": \"cat\", \"right\": \"пес\" }]",
                CorrectAnswer = "{}",
                Order = 1
            });
        });
    }

    [Fact]
    public void Create_Match_ValidData_ShouldCreate()
    {
        var dbContext = TestDbContextFactory.Create();
        SeedLesson(dbContext);

        var service = new AdminExerciseService(dbContext);

        var result = service.Create(new CreateExerciseRequest
        {
            LessonId = 1,
            Type = "Match",
            Question = "Match words",
            Data = "[{ \"left\": \"cat\", \"right\": \"кіт\" },{ \"left\": \"dog\", \"right\": \"пес\" }]",
            CorrectAnswer = "{}",
            Order = 1
        });

        Assert.True(result.Id > 0);
        Assert.Equal(1, result.LessonId);
        Assert.Equal("Match", result.Type);
    }

    
    [Fact]
    public void Create_OrderZero_ShouldCreate_AndBeLastInGetByLesson()
    {
        var dbContext = TestDbContextFactory.Create();
        SeedLesson(dbContext);

        var service = new AdminExerciseService(dbContext);

        service.Create(new CreateExerciseRequest
        {
            LessonId = 1,
            Type = "Input",
            Question = "Q1",
            Data = "{}",
            CorrectAnswer = "A",
            Order = 1
        });

        var result = service.Create(new CreateExerciseRequest
        {
            LessonId = 1,
            Type = "Input",
            Question = "Q2",
            Data = "{}",
            CorrectAnswer = "B",
            Order = 0
        });

        var list = service.GetByLesson(1);

        Assert.Equal(2, list.Count);
        Assert.Equal(1, list[0].Order);
        Assert.Equal(result.Id, list[1].Id);
        Assert.Equal(0, list[1].Order);
    }

    [Fact]
    public void Create_DuplicatePositiveOrderInLesson_ShouldThrow()
    {
        var dbContext = TestDbContextFactory.Create();
        SeedLesson(dbContext);

        var service = new AdminExerciseService(dbContext);

        service.Create(new CreateExerciseRequest
        {
            LessonId = 1,
            Type = "Input",
            Question = "Q1",
            Data = "{}",
            CorrectAnswer = "A",
            Order = 1
        });

        Assert.Throws<ArgumentException>(() =>
        {
            service.Create(new CreateExerciseRequest
            {
                LessonId = 1,
                Type = "Input",
                Question = "Q2",
                Data = "{}",
                CorrectAnswer = "B",
                Order = 1
            });
        });
    }


    [Fact]
    public void Create_Input_CorrectAnswerAsJsonArray_ShouldCreate()
    {
        var dbContext = TestDbContextFactory.Create();
        SeedLesson(dbContext);

        var service = new AdminExerciseService(dbContext);

        var result = service.Create(new CreateExerciseRequest
        {
            LessonId = 1,
            Type = "Input",
            Question = "Q1",
            Data = "{}",
            CorrectAnswer = "[\"A\",\"B\"]",
            Order = 1
        });

        Assert.True(result.Id > 0);
        Assert.Equal("Input", result.Type);
    }

    [Fact]
    public void Create_WithImageUrl_ShouldSaveImageUrl()
    {
        var dbContext = TestDbContextFactory.Create();
        SeedLesson(dbContext);

        var service = new AdminExerciseService(dbContext);

        var result = service.Create(new CreateExerciseRequest
        {
            LessonId = 1,
            Type = "MultipleChoice",
            Question = "кіт",
            Data = "[\"cat\",\"dog\"]",
            CorrectAnswer = "cat",
            Order = 1,
            ImageUrl = "/uploads/cat.png"
        });

        Assert.Equal("/uploads/cat.png", result.ImageUrl);

        var saved = dbContext.Exercises.First(x => x.Id == result.Id);
        Assert.Equal("/uploads/cat.png", saved.ImageUrl);
    }


    [Fact]
    public void Create_WithImageFileName_ShouldNormalizeImageUrl()
    {
        var dbContext = TestDbContextFactory.Create();
        SeedLesson(dbContext);

        var service = new AdminExerciseService(dbContext);

        var result = service.Create(new CreateExerciseRequest
        {
            LessonId = 1,
            Type = "MultipleChoice",
            Question = "червоний",
            Data = "[\"red\",\"blue\"]",
            CorrectAnswer = "red",
            Order = 1,
            ImageUrl = "red.png"
        });

        Assert.Equal("/uploads/lessons/red.png", result.ImageUrl);

        var saved = dbContext.Exercises.First(x => x.Id == result.Id);
        Assert.Equal("/uploads/lessons/red.png", saved.ImageUrl);
    }

private static void SeedLesson(Lumino.Api.Data.LuminoDbContext dbContext)
    {
        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "English A1",
            Description = "Desc",
            IsPublished = true
        });

        dbContext.Topics.Add(new Topic
        {
            Id = 1,
            CourseId = 1,
            Title = "Basics",
            Order = 1
        });

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            TopicId = 1,
            Title = "Lesson 1",
            Theory = "T",
            Order = 1
        });

        dbContext.SaveChanges();
    }

    [Fact]
    public void Create_WhenLessonAlreadyHasNineExercises_Throws()
    {
        var dbContext = TestDbContextFactory.Create();
        SeedLesson(dbContext);

        for (int i = 1; i <= 9; i++)
        {
            dbContext.Exercises.Add(new Exercise
            {
                LessonId = 1,
                Type = Lumino.Api.Domain.Enums.ExerciseType.Input,
                Question = $"Q{i}",
                Data = "{}",
                CorrectAnswer = "A",
                Order = i
            });
        }

        dbContext.SaveChanges();

        var service = new AdminExerciseService(dbContext);

        var ex = Assert.Throws<ArgumentException>(() => service.Create(new CreateExerciseRequest
        {
            LessonId = 1,
            Type = "Input",
            Question = "Q10",
            Data = "{}",
            CorrectAnswer = "A",
            Order = 0
        }));

        Assert.Contains("at most 9 exercises", ex.Message);
    }

    [Fact]
    public void Copy_WhenTargetLessonAlreadyHasNineExercises_Throws()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "English A1",
            Description = "Desc",
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
            new Lesson { Id = 1, TopicId = 1, Title = "Source", Theory = "T", Order = 1 },
            new Lesson { Id = 2, TopicId = 1, Title = "Target", Theory = "T", Order = 2 }
        );

        dbContext.SaveChanges();

        dbContext.Exercises.Add(new Exercise
        {
            LessonId = 1,
            Type = Lumino.Api.Domain.Enums.ExerciseType.Input,
            Question = "Q1",
            Data = "{}",
            CorrectAnswer = "A",
            Order = 1
        });

        for (int i = 1; i <= 9; i++)
        {
            dbContext.Exercises.Add(new Exercise
            {
                LessonId = 2,
                Type = Lumino.Api.Domain.Enums.ExerciseType.Input,
                Question = $"Q{i}",
                Data = "{}",
                CorrectAnswer = "A",
                Order = i
            });
        }

        dbContext.SaveChanges();

        var service = new AdminExerciseService(dbContext);

        var ex = Assert.Throws<ArgumentException>(() => service.Copy(1, new CopyItemRequest
        {
            TargetLessonId = 2
        }));

        Assert.Contains("at most 9 exercises", ex.Message);
    }

    [Fact]
    public void Copy_WhenTargetLessonHasGap_UsesFirstFreeOrder()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "English A1",
            Description = "Desc",
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
            new Lesson { Id = 1, TopicId = 1, Title = "Source", Theory = "T", Order = 1 },
            new Lesson { Id = 2, TopicId = 1, Title = "Target", Theory = "T", Order = 2 }
        );

        dbContext.SaveChanges();

        dbContext.Exercises.Add(new Exercise
        {
            LessonId = 1,
            Type = Lumino.Api.Domain.Enums.ExerciseType.Input,
            Question = "Q1",
            Data = "{}",
            CorrectAnswer = "A",
            Order = 1
        });

        dbContext.Exercises.AddRange(
            new Exercise
            {
                LessonId = 2,
                Type = Lumino.Api.Domain.Enums.ExerciseType.Input,
                Question = "Q1",
                Data = "{}",
                CorrectAnswer = "A",
                Order = 1
            },
            new Exercise
            {
                LessonId = 2,
                Type = Lumino.Api.Domain.Enums.ExerciseType.Input,
                Question = "Q3",
                Data = "{}",
                CorrectAnswer = "A",
                Order = 3
            }
        );

        dbContext.SaveChanges();

        var service = new AdminExerciseService(dbContext);

        var copied = service.Copy(1, new CopyItemRequest
        {
            TargetLessonId = 2
        });

        Assert.Equal(2, copied.Order);
    }

    [Fact]
    public void Create_WhenOrderGreaterThanNine_Throws()
    {
        var dbContext = TestDbContextFactory.Create();
        SeedLesson(dbContext);

        var service = new AdminExerciseService(dbContext);

        var ex = Assert.Throws<ArgumentException>(() => service.Create(new CreateExerciseRequest
        {
            LessonId = 1,
            Type = "Input",
            Question = "Q10",
            Data = "{}",
            CorrectAnswer = "A",
            Order = 10
        }));

        Assert.Contains("between 1 and 9", ex.Message);
    }

}
