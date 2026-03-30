using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;
using Xunit;

namespace Lumino.Tests;

public class LessonResultServiceTests
{
    [Fact]
    public void SubmitLesson_ShouldCreateLessonResult_AndUpdateProgress()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            Title = "Lesson 1",
            Theory = "Text",
            TopicId = 1,
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 1,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q1",
            Data = "",
            CorrectAnswer = "hello",
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 2,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q2",
            Data = "",
            CorrectAnswer = "world",
            Order = 2
        });

        // урок має бути unlocked для цього користувача
        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FakeDateTimeProvider(),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "hello" },
                new SubmitExerciseAnswerRequest { ExerciseId = 2, Answer = "world" }
            }
        });

        Assert.Equal(2, response.TotalExercises);
        Assert.Equal(2, response.CorrectAnswers);
        Assert.True(response.IsPassed);
    }

        [Fact]
    public void SubmitLesson_WhenUserAnswerHasExtraSpacesAndCase_ShouldStillBeCorrect()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            Title = "Lesson 1",
            Theory = "Text",
            TopicId = 1,
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 1,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q1",
            Data = "",
            CorrectAnswer = "Good Morning",
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 2,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q2",
            Data = "",
            CorrectAnswer = "HELLO",
            Order = 2
        });

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FakeDateTimeProvider(),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "  good   morning  " },
                new SubmitExerciseAnswerRequest { ExerciseId = 2, Answer = "  hello " }
            }
        });

        Assert.Equal(2, response.TotalExercises);
        Assert.Equal(2, response.CorrectAnswers);
        Assert.True(response.IsPassed);
    }


    [Fact]
    public void SubmitLesson_WhenExerciseHasLinkedVocabularyTranslations_ShouldAcceptAlternativeTranslation()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            Title = "Lesson 1",
            Theory = "Text",
            TopicId = 1,
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 1,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "room",
            Data = "",
            CorrectAnswer = "кімната",
            Order = 1
        });

        dbContext.VocabularyItems.Add(new VocabularyItem
        {
            Id = 100,
            Word = "room",
            Translation = "кімната"
        });

        dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
        {
            VocabularyItemId = 100,
            Translation = "кімната",
            Order = 0
        });

        dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
        {
            VocabularyItemId = 100,
            Translation = "номер",
            Order = 1
        });

        dbContext.ExerciseVocabularies.Add(new ExerciseVocabulary
        {
            ExerciseId = 1,
            VocabularyItemId = 100
        });

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FakeDateTimeProvider(),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "номер" }
            }
        });

        Assert.Equal(1, response.TotalExercises);
        Assert.Equal(1, response.CorrectAnswers);
        Assert.True(response.IsPassed);
    }

    [Fact]
    public void SubmitLesson_WhenPassedFirstTime_ShouldReturnCrystalsEqualToLessonPoints()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.Add(new User
        {
            Id = 10,
            Email = "user@test.com",
            PasswordHash = "hash",
            IsEmailVerified = true,
            Role = Role.User,
            CreatedAt = DateTime.UtcNow,
            NativeLanguageCode = "uk",
            TargetLanguageCode = "en",
            Crystals = 0
        });

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            Title = "Lesson 1",
            Theory = "Text",
            TopicId = 1,
            Order = 1
        });

        for (int i = 1; i <= 9; i++)
        {
            dbContext.Exercises.Add(new Exercise
            {
                Id = i,
                LessonId = 1,
                Type = ExerciseType.Input,
                Question = $"Q{i}",
                Data = "",
                CorrectAnswer = $"A{i}",
                Order = i
            });
        }

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var learningSettings = Options.Create(new LearningSettings
        {
            PassingScorePercent = 80,
            LessonCorrectAnswerScore = 5,
            CrystalsRewardPerPassedLesson = 5
        });

        var economyService = new UserEconomyService(dbContext, learningSettings);

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FakeDateTimeProvider(),
            economyService,
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            learningSettings
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = Enumerable.Range(1, 9)
                .Select(x => new SubmitExerciseAnswerRequest
                {
                    ExerciseId = x,
                    Answer = $"A{x}"
                })
                .ToList()
        });

        var user = dbContext.Users.First(x => x.Id == 10);

        Assert.True(response.IsPassed);
        Assert.Equal(45, response.EarnedPoints);
        Assert.Equal(45, response.EarnedCrystals);
        Assert.Equal(45, user.Crystals);
    }

    [Fact]
    public void SubmitLesson_WhenPassed_ShouldAddLessonWordsToUserVocabulary()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            Title = "Hello lesson",
            Theory = "hello = привіт\nthank you = дякую",
            TopicId = 1,
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 1,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Write Ukrainian for: hello",
            Data = "{}",
            CorrectAnswer = "привіт",
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 2,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Write Ukrainian for: thank you",
            Data = "{}",
            CorrectAnswer = "дякую",
            Order = 2
        });

        // урок має бути unlocked для цього користувача
        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var now = new DateTime(2026, 2, 11, 12, 0, 0, DateTimeKind.Utc);

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FixedDateTimeProvider(now),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "привіт" },
                new SubmitExerciseAnswerRequest { ExerciseId = 2, Answer = "дякую" }
            }
        });

        Assert.True(response.IsPassed);

        var userWords = dbContext.UserVocabularies
            .Where(x => x.UserId == 10)
            .ToList();

        Assert.Equal(2, userWords.Count);

        var vocabIds = userWords.Select(x => x.VocabularyItemId).ToList();

        var items = dbContext.VocabularyItems
            .Where(x => vocabIds.Contains(x.Id))
            .ToList();

        Assert.Contains(items, x => x.Word == "hello" && x.Translation == "привіт");
        Assert.Contains(items, x => x.Word == "thank you" && x.Translation == "дякую");

        // без помилок — повторення завтра
        Assert.All(userWords, x => Assert.Equal(now.AddDays(1), x.NextReviewAt));
    }


    [Fact]
    public void SubmitLesson_WhenPassedWithLinkedGlobalVocabulary_ShouldCreatePrivateCopiesForUser()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "Course",
            Description = "Desc",
            LanguageCode = "en",
            Order = 1
        });

        dbContext.Topics.Add(new Topic
        {
            Id = 1,
            CourseId = 1,
            Title = "Topic",
            Order = 1
        });

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            Title = "Linked vocab lesson",
            Theory = "Theory",
            TopicId = 1,
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 1,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Write hello",
            Data = "{}",
            CorrectAnswer = "привіт",
            Order = 1
        });

        dbContext.VocabularyItems.Add(new VocabularyItem
        {
            Id = 100,
            Word = "hello",
            Translation = "привіт",
            Definition = "Global definition"
        });

        dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
        {
            VocabularyItemId = 100,
            Translation = "привіт",
            Order = 0
        });

        dbContext.LessonVocabularies.Add(new LessonVocabulary
        {
            LessonId = 1,
            VocabularyItemId = 100
        });

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var now = new DateTime(2026, 2, 11, 12, 0, 0, DateTimeKind.Utc);

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FixedDateTimeProvider(now),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "привіт" }
            }
        });

        Assert.True(response.IsPassed);

        var userWord = dbContext.UserVocabularies.Single(x => x.UserId == 10);
        Assert.NotEqual(100, userWord.VocabularyItemId);
        Assert.Equal(now.AddDays(1), userWord.NextReviewAt);

        var privateItem = dbContext.VocabularyItems.Single(x => x.Id == userWord.VocabularyItemId);
        Assert.Equal("hello", privateItem.Word);
        Assert.Equal("привіт", privateItem.Translation);
        Assert.Equal("Global definition", privateItem.Definition);

        var globalItem = dbContext.VocabularyItems.Single(x => x.Id == 100);
        Assert.Equal("hello", globalItem.Word);
        Assert.Equal("привіт", globalItem.Translation);
        Assert.Equal("Global definition", globalItem.Definition);
    }

    [Fact]
    public void SubmitLesson_WhenPassed_ShouldUnlockNextLesson_AndMoveActiveCourseLastLessonId()
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

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            TopicId = 1,
            Title = "Lesson 1",
            Theory = "T",
            Order = 1
        });

        dbContext.Lessons.Add(new Lesson
        {
            Id = 2,
            TopicId = 1,
            Title = "Lesson 2",
            Theory = "T",
            Order = 2
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 1,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q1",
            Data = "",
            CorrectAnswer = "ok",
            Order = 1
        });

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FixedDateTimeProvider(now),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "ok" }
            }
        });

        Assert.True(response.IsPassed);

        var p1 = dbContext.UserLessonProgresses.First(x => x.UserId == 10 && x.LessonId == 1);
        Assert.True(p1.IsCompleted);

        var p2 = dbContext.UserLessonProgresses.First(x => x.UserId == 10 && x.LessonId == 2);
        Assert.True(p2.IsUnlocked);

        var activeCourse = dbContext.UserCourses.First(x => x.UserId == 10 && x.CourseId == 1);
        Assert.True(activeCourse.IsActive);
        Assert.Equal(2, activeCourse.LastLessonId);
    }

    [Fact]
    public void SubmitLesson_WhenPassed_OrderZero_ShouldUnlockNextLesson_ByIdFallback()
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
            Id = 5,
            CourseId = 1,
            Title = "Basics",
            Order = 0
        });

        dbContext.Lessons.Add(new Lesson
        {
            Id = 10,
            TopicId = 5,
            Title = "Lesson 10",
            Theory = "T",
            Order = 0
        });

        dbContext.Lessons.Add(new Lesson
        {
            Id = 20,
            TopicId = 5,
            Title = "Lesson 20",
            Theory = "T",
            Order = 0
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 100,
            LessonId = 10,
            Type = ExerciseType.Input,
            Question = "Q1",
            Data = "",
            CorrectAnswer = "ok",
            Order = 1
        });

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 10,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FixedDateTimeProvider(now),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 10,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 100, Answer = "ok" }
            }
        });

        Assert.True(response.IsPassed);

        var p2 = dbContext.UserLessonProgresses.First(x => x.UserId == 10 && x.LessonId == 20);
        Assert.True(p2.IsUnlocked);

        var activeCourse = dbContext.UserCourses.First(x => x.UserId == 10 && x.CourseId == 1);
        Assert.Equal(20, activeCourse.LastLessonId);
    }

    [Fact]
    public void SubmitLesson_WhenPassed_ShouldAddLessonWordsToUserVocabulary_ByLessonVocabulary_EvenIfTheoryEmpty()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            Title = "Hello lesson",
            Theory = "",
            TopicId = 1,
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 1,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q1",
            Data = "{}",
            CorrectAnswer = "ok",
            Order = 1
        });

        dbContext.VocabularyItems.Add(new VocabularyItem
        {
            Id = 1,
            Word = "hello",
            Translation = "привіт",
            Example = null
        });

        dbContext.LessonVocabularies.Add(new LessonVocabulary
        {
            LessonId = 1,
            VocabularyItemId = 1
        });

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var now = new DateTime(2026, 2, 13, 12, 0, 0, DateTimeKind.Utc);

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FixedDateTimeProvider(now),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "ok" }
            }
        });

        Assert.True(response.IsPassed);

        var userWords = dbContext.UserVocabularies
            .Where(x => x.UserId == 10)
            .ToList();

        Assert.Single(userWords);

        var item = dbContext.VocabularyItems.First(x => x.Id == userWords[0].VocabularyItemId);

        Assert.Equal("hello", item.Word);
        Assert.Equal("привіт", item.Translation);

        Assert.Equal(now.AddDays(1), userWords[0].NextReviewAt);
    }

    [Fact]
    public void SubmitLesson_WhenPassed_WithMistake_ShouldAddMistakeWordDueNow_ByExerciseVocabulary()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            Title = "Lesson 1",
            Theory = "",
            TopicId = 1,
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 1,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q1",
            Data = "{}",
            CorrectAnswer = "right",
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 2,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q2",
            Data = "{}",
            CorrectAnswer = "a",
            Order = 2
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 3,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q3",
            Data = "{}",
            CorrectAnswer = "b",
            Order = 3
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 4,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q4",
            Data = "{}",
            CorrectAnswer = "c",
            Order = 4
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 5,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q5",
            Data = "{}",
            CorrectAnswer = "d",
            Order = 5
        });

        dbContext.VocabularyItems.Add(new VocabularyItem
        {
            Id = 1,
            Word = "coffee",
            Translation = "кава",
            Example = null
        });

        dbContext.ExerciseVocabularies.Add(new ExerciseVocabulary
        {
            ExerciseId = 1,
            VocabularyItemId = 1
        });

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var now = new DateTime(2026, 2, 14, 9, 0, 0, DateTimeKind.Utc);

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FixedDateTimeProvider(now),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "wrong" },
                new SubmitExerciseAnswerRequest { ExerciseId = 2, Answer = "a" },
                new SubmitExerciseAnswerRequest { ExerciseId = 3, Answer = "b" },
                new SubmitExerciseAnswerRequest { ExerciseId = 4, Answer = "c" },
                new SubmitExerciseAnswerRequest { ExerciseId = 5, Answer = "d" }
            }
        });

        Assert.True(response.IsPassed);
        Assert.Contains(1, response.MistakeExerciseIds);

        var userWord = dbContext.UserVocabularies
            .FirstOrDefault(x => x.UserId == 10);

        Assert.NotNull(userWord);

        var item = dbContext.VocabularyItems.First(x => x.Id == userWord!.VocabularyItemId);

        Assert.Equal("coffee", item.Word);
        Assert.Equal("кава", item.Translation);
        Assert.Equal(now, userWord.NextReviewAt);
    }

    [Fact]
    public void SubmitLesson_WhenSameWordHasAnotherTranslation_ShouldMergeIntoSingleUserVocabulary()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            Title = "Lesson 1",
            Theory = "",
            TopicId = 1,
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 1,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q1",
            Data = "{}",
            CorrectAnswer = "right",
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 2,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q2",
            Data = "{}",
            CorrectAnswer = "a",
            Order = 2
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 3,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q3",
            Data = "{}",
            CorrectAnswer = "b",
            Order = 3
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 4,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q4",
            Data = "{}",
            CorrectAnswer = "c",
            Order = 4
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 5,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q5",
            Data = "{}",
            CorrectAnswer = "d",
            Order = 5
        });

        dbContext.VocabularyItems.Add(new VocabularyItem
        {
            Id = 1,
            Word = "run",
            Translation = "бігти"
        });

        dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
        {
            VocabularyItemId = 1,
            Translation = "бігти",
            Order = 0
        });

        dbContext.VocabularyItems.Add(new VocabularyItem
        {
            Id = 2,
            Word = "run",
            Translation = "запускати"
        });

        dbContext.VocabularyItemTranslations.Add(new VocabularyItemTranslation
        {
            VocabularyItemId = 2,
            Translation = "запускати",
            Order = 0
        });

        dbContext.LessonVocabularies.Add(new LessonVocabulary
        {
            LessonId = 1,
            VocabularyItemId = 1
        });

        dbContext.ExerciseVocabularies.Add(new ExerciseVocabulary
        {
            ExerciseId = 1,
            VocabularyItemId = 2
        });

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var now = new DateTime(2026, 2, 14, 9, 0, 0, DateTimeKind.Utc);

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FixedDateTimeProvider(now),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "wrong" },
                new SubmitExerciseAnswerRequest { ExerciseId = 2, Answer = "a" },
                new SubmitExerciseAnswerRequest { ExerciseId = 3, Answer = "b" },
                new SubmitExerciseAnswerRequest { ExerciseId = 4, Answer = "c" },
                new SubmitExerciseAnswerRequest { ExerciseId = 5, Answer = "d" }
            }
        });

        Assert.True(response.IsPassed);
        Assert.Single(dbContext.UserVocabularies.Where(x => x.UserId == 10));

        var userWord = dbContext.UserVocabularies.Single(x => x.UserId == 10);
        var item = dbContext.VocabularyItems.Single(x => x.Id == userWord.VocabularyItemId);
        var translations = dbContext.VocabularyItemTranslations
            .Where(x => x.VocabularyItemId == item.Id)
            .OrderBy(x => x.Order)
            .Select(x => x.Translation)
            .ToList();

        Assert.Equal("run", item.Word);
        Assert.Equal(new List<string> { "бігти", "запускати" }, translations);
        Assert.Equal(now, userWord.NextReviewAt);
    }

    [Fact]
    public void SubmitLesson_WhenCompletesAllLessonsInCourse_ShouldMarkUserCourseCompleted()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "Course 1",
            Description = "D",
            IsPublished = true
        });

        dbContext.Topics.Add(new Topic
        {
            Id = 1,
            CourseId = 1,
            Title = "Topic 1",
            Order = 1
        });

        dbContext.Lessons.AddRange(
            new Lesson
            {
                Id = 1,
                Title = "Lesson 1",
                Theory = "Text",
                TopicId = 1,
                Order = 1
            },
            new Lesson
            {
                Id = 2,
                Title = "Lesson 2",
                Theory = "Text",
                TopicId = 1,
                Order = 2
            }
        );

        dbContext.Exercises.AddRange(
            new Exercise
            {
                Id = 1,
                LessonId = 1,
                Type = ExerciseType.Input,
                Question = "Q1",
                Data = "",
                CorrectAnswer = "a",
                Order = 1
            },
            new Exercise
            {
                Id = 2,
                LessonId = 2,
                Type = ExerciseType.Input,
                Question = "Q2",
                Data = "",
                CorrectAnswer = "b",
                Order = 1
            }
        );

        // урок 1 має бути unlocked для цього користувача (інакше SubmitLesson кине "Lesson is locked")
        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 1,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FakeDateTimeProvider(),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var r1 = service.SubmitLesson(1, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "a" }
            }
        });

        Assert.True(r1.IsPassed);

        var r2 = service.SubmitLesson(1, new SubmitLessonRequest
        {
            LessonId = 2,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 2, Answer = "b" }
            }
        });

        Assert.True(r2.IsPassed);

        var userCourse = dbContext.UserCourses.FirstOrDefault(x => x.UserId == 1 && x.CourseId == 1);

        Assert.NotNull(userCourse);
        Assert.True(userCourse!.IsCompleted);
        Assert.NotNull(userCourse.CompletedAt);
    }


    [Fact]
    public void SubmitLesson_ShouldReturnAnswersOrderedByOrder_ThenIdFallback()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            Title = "Lesson 1",
            Theory = "",
            TopicId = 1,
            Order = 1
        });

        dbContext.Exercises.AddRange(
            new Exercise
            {
                Id = 10,
                LessonId = 1,
                Type = ExerciseType.Input,
                Question = "Q2",
                Data = "",
                CorrectAnswer = "b",
                Order = 2
            },
            new Exercise
            {
                Id = 5,
                LessonId = 1,
                Type = ExerciseType.Input,
                Question = "Q1",
                Data = "",
                CorrectAnswer = "a",
                Order = 1
            },
            new Exercise
            {
                Id = 20,
                LessonId = 1,
                Type = ExerciseType.Input,
                Question = "Q3",
                Data = "",
                CorrectAnswer = "c",
                Order = 0
            }
        );

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FakeDateTimeProvider(),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 10, Answer = "b" },
                new SubmitExerciseAnswerRequest { ExerciseId = 20, Answer = "c" },
                new SubmitExerciseAnswerRequest { ExerciseId = 5, Answer = "a" }
            }
        });

        Assert.True(response.IsPassed);
        Assert.Equal(3, response.Answers.Count);

        Assert.Equal(5, response.Answers[0].ExerciseId);
        Assert.Equal(10, response.Answers[1].ExerciseId);
        Assert.Equal(20, response.Answers[2].ExerciseId);
    }


    [Fact]
    public void SubmitLesson_WhenCrossingTopicWithFallbackScene_ShouldNotUnlockNextTopicLessonBeforeScene()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.Add(new User
        {
            Id = 10,
            Email = "user@test.com",
            PasswordHash = "hash",
            IsEmailVerified = true,
            Role = Role.User,
            CreatedAt = DateTime.UtcNow,
            NativeLanguageCode = "uk",
            TargetLanguageCode = "en"
        });

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "English A1",
            Description = "Demo",
            IsPublished = true
        });

        dbContext.Topics.AddRange(
            new Topic { Id = 1, CourseId = 1, Title = "Topic 1", Order = 1 },
            new Topic { Id = 2, CourseId = 1, Title = "Topic 2", Order = 2 }
        );

        dbContext.Lessons.AddRange(
            new Lesson { Id = 1, TopicId = 1, Title = "T1 L1", Theory = "T", Order = 1 },
            new Lesson { Id = 2, TopicId = 2, Title = "T2 L1", Theory = "T", Order = 1 }
        );

        dbContext.Exercises.Add(new Exercise
        {
            Id = 1,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q1",
            Data = "{}",
            CorrectAnswer = "ok",
            Order = 1
        });

        dbContext.Scenes.Add(new Scene
        {
            Id = 100,
            Title = "Scene 1",
            Description = "D",
            SceneType = "Dialogue",
            Order = 1
        });

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.UserCourses.Add(new UserCourse
        {
            UserId = 10,
            CourseId = 1,
            LastLessonId = 1,
            IsCompleted = false,
            LastOpenedAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FakeDateTimeProvider(),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "ok" }
            }
        });

        var nextProgress = dbContext.UserLessonProgresses.FirstOrDefault(x => x.UserId == 10 && x.LessonId == 2);

        Assert.True(response.IsPassed);
        Assert.Null(nextProgress);
    }

    [Fact]
    public void SubmitLesson_WhenCorrectAnswerIsJsonArray_ShouldAcceptAnyOfAnswers()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            Title = "Lesson 1",
            Theory = "Text",
            TopicId = 1,
            Order = 1
        });

        dbContext.Exercises.Add(new Exercise
        {
            Id = 1,
            LessonId = 1,
            Type = ExerciseType.Input,
            Question = "Q1",
            Data = "{}",
            CorrectAnswer = "[\"hello\",\"hi\"]",
            Order = 1
        });

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FakeDateTimeProvider(),
            new FakeUserEconomyService(),
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            Options.Create(new LearningSettings { PassingScorePercent = 80 })
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "hi" }
            }
        });

        Assert.Equal(1, response.TotalExercises);
        Assert.Equal(1, response.CorrectAnswers);
        Assert.True(response.IsPassed);
    }

    [Fact]
    public void SubmitLesson_WhenNotPassed_ShouldStillAwardCrystalsForCorrectAnswers()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.Add(new User
        {
            Id = 10,
            Email = "user@test.com",
            PasswordHash = "hash",
            IsEmailVerified = true,
            Role = Role.User,
            CreatedAt = DateTime.UtcNow,
            NativeLanguageCode = "uk",
            TargetLanguageCode = "en",
            Crystals = 0
        });

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            Title = "Lesson 1",
            Theory = "Text",
            TopicId = 1,
            Order = 1
        });

        for (int i = 1; i <= 6; i++)
        {
            dbContext.Exercises.Add(new Exercise
            {
                Id = i,
                LessonId = 1,
                Type = ExerciseType.Input,
                Question = $"Q{i}",
                Data = "",
                CorrectAnswer = $"A{i}",
                Order = i
            });
        }

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var learningSettings = Options.Create(new LearningSettings
        {
            PassingScorePercent = 80,
            LessonCorrectAnswerScore = 5,
            CrystalsRewardPerPassedLesson = 0
        });

        var economyService = new UserEconomyService(dbContext, learningSettings);
        var streakService = new FakeStreakService();

        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FakeDateTimeProvider(),
            economyService,
            streakService,
            new FakeSubmitLessonValidator(),
            learningSettings
        );

        var response = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "A1" },
                new SubmitExerciseAnswerRequest { ExerciseId = 2, Answer = "A2" },
                new SubmitExerciseAnswerRequest { ExerciseId = 3, Answer = "A3" },
                new SubmitExerciseAnswerRequest { ExerciseId = 4, Answer = "A4" },
                new SubmitExerciseAnswerRequest { ExerciseId = 5, Answer = "wrong" },
                new SubmitExerciseAnswerRequest { ExerciseId = 6, Answer = "wrong" }
            }
        });

        var user = dbContext.Users.First(x => x.Id == 10);

        Assert.False(response.IsPassed);
        Assert.Equal(20, response.EarnedCrystals);
        Assert.Equal(20, user.Crystals);
        Assert.Equal(1, streakService.RegisterLessonActivityCallsCount);
    }

    [Fact]
    public void SubmitLesson_WhenImprovedAfterPreviousAttempt_ShouldAwardOnlyCrystalsForImprovement()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.Add(new User
        {
            Id = 10,
            Email = "user@test.com",
            PasswordHash = "hash",
            IsEmailVerified = true,
            Role = Role.User,
            CreatedAt = DateTime.UtcNow,
            NativeLanguageCode = "uk",
            TargetLanguageCode = "en",
            Crystals = 0
        });

        dbContext.Lessons.Add(new Lesson
        {
            Id = 1,
            Title = "Lesson 1",
            Theory = "Text",
            TopicId = 1,
            Order = 1
        });

        for (int i = 1; i <= 6; i++)
        {
            dbContext.Exercises.Add(new Exercise
            {
                Id = i,
                LessonId = 1,
                Type = ExerciseType.Input,
                Question = $"Q{i}",
                Data = "",
                CorrectAnswer = $"A{i}",
                Order = i
            });
        }

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 10,
            LessonId = 1,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 0,
            LastAttemptAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var learningSettings = Options.Create(new LearningSettings
        {
            PassingScorePercent = 80,
            LessonCorrectAnswerScore = 5,
            CrystalsRewardPerPassedLesson = 0
        });

        var economyService = new UserEconomyService(dbContext, learningSettings);
        var service = new LessonResultService(
            dbContext,
            new FakeAchievementService(),
            new FakeDateTimeProvider(),
            economyService,
            new FakeStreakService(),
            new FakeSubmitLessonValidator(),
            learningSettings
        );

        var firstResponse = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "A1" },
                new SubmitExerciseAnswerRequest { ExerciseId = 2, Answer = "A2" },
                new SubmitExerciseAnswerRequest { ExerciseId = 3, Answer = "A3" },
                new SubmitExerciseAnswerRequest { ExerciseId = 4, Answer = "A4" },
                new SubmitExerciseAnswerRequest { ExerciseId = 5, Answer = "wrong" },
                new SubmitExerciseAnswerRequest { ExerciseId = 6, Answer = "wrong" }
            }
        });

        var secondResponse = service.SubmitLesson(10, new SubmitLessonRequest
        {
            LessonId = 1,
            Answers = new List<SubmitExerciseAnswerRequest>
            {
                new SubmitExerciseAnswerRequest { ExerciseId = 1, Answer = "A1" },
                new SubmitExerciseAnswerRequest { ExerciseId = 2, Answer = "A2" },
                new SubmitExerciseAnswerRequest { ExerciseId = 3, Answer = "A3" },
                new SubmitExerciseAnswerRequest { ExerciseId = 4, Answer = "A4" },
                new SubmitExerciseAnswerRequest { ExerciseId = 5, Answer = "A5" },
                new SubmitExerciseAnswerRequest { ExerciseId = 6, Answer = "A6" }
            }
        });

        var user = dbContext.Users.First(x => x.Id == 10);

        Assert.Equal(20, firstResponse.EarnedCrystals);
        Assert.Equal(10, secondResponse.EarnedCrystals);
        Assert.Equal(30, user.Crystals);
    }

}
