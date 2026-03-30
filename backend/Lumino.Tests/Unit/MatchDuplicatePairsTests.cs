using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;
using System.Text.Json;
using Xunit;

namespace Lumino.Tests;

public class MatchDuplicatePairsTests
{
    [Fact]
    public void SubmitLesson_WhenMatchHasDuplicateLeftTexts_ShouldStillBeCorrect()
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
            Type = ExerciseType.Match,
            Question = "Match the words",
            Data = JsonSerializer.Serialize(new[]
            {
                new { left = "No, I don’t", right = "Ні, я не люблю" },
                new { left = "No, I don’t", right = "Ні, я не читаю" }
            }),
            CorrectAnswer = string.Empty,
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
                new SubmitExerciseAnswerRequest
                {
                    ExerciseId = 1,
                    Answer = JsonSerializer.Serialize(new[]
                    {
                        new { left = "No, I don’t", right = "Ні, я не люблю" },
                        new { left = "No, I don’t", right = "Ні, я не читаю" }
                    })
                }
            }
        });

        Assert.Equal(1, response.TotalExercises);
        Assert.Equal(1, response.CorrectAnswers);
        Assert.True(response.IsPassed);
    }

    [Fact]
    public void SubmitLessonMistakes_WhenMatchHasDuplicateLeftTexts_ShouldStillBeCorrect()
    {
        var dbContext = TestDbContextFactory.Create();

        SeedLessonBase(dbContext, lessonId: 1, isUnlocked: true);

        dbContext.Exercises.Add(new Exercise
        {
            Id = 10,
            LessonId = 1,
            Order = 1,
            Type = ExerciseType.Match,
            Question = "Match the words",
            CorrectAnswer = string.Empty,
            Data = JsonSerializer.Serialize(new[]
            {
                new { left = "No, I don’t", right = "Ні, я не люблю" },
                new { left = "No, I don’t", right = "Ні, я не читаю" }
            })
        });

        var details = new LessonResultDetailsJson
        {
            MistakeExerciseIds = new() { 10 },
            Answers = new()
            {
                new LessonAnswerResultDto { ExerciseId = 10, UserAnswer = string.Empty, CorrectAnswer = string.Empty, IsCorrect = false }
            }
        };

        dbContext.LessonResults.Add(new LessonResult
        {
            Id = 1,
            UserId = 1,
            LessonId = 1,
            Score = 0,
            TotalQuestions = 1,
            CompletedAt = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc),
            MistakesJson = JsonSerializer.Serialize(details)
        });

        dbContext.SaveChanges();

        var service = new LessonMistakesService(
            dbContext,
            new FakeAchievementService(),
            new FixedDateTimeProvider(new DateTime(2026, 2, 16, 12, 0, 0, DateTimeKind.Utc)),
            Options.Create(new LearningSettings
            {
                PassingScorePercent = 80,
                SceneUnlockEveryLessons = 1
            }),
            new FakeUserEconomyService()
        );

        var response = service.SubmitLessonMistakes(userId: 1, lessonId: 1, new SubmitLessonMistakesRequest
        {
            Answers = new()
            {
                new SubmitExerciseAnswerRequest
                {
                    ExerciseId = 10,
                    Answer = JsonSerializer.Serialize(new[]
                    {
                        new { left = "No, I don’t", right = "Ні, я не люблю" },
                        new { left = "No, I don’t", right = "Ні, я не читаю" }
                    })
                }
            }
        });

        Assert.True(response.IsCompleted);
        Assert.Empty(response.MistakeExerciseIds);
        Assert.Equal(1, response.TotalExercises);
        Assert.Equal(1, response.CorrectAnswers);
    }

    [Fact]
    public void SubmitLesson_WhenMatchHasDuplicateLeftTexts_AndPairsAreSwappedByIndex_ShouldBeCorrect()
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
            Type = ExerciseType.Match,
            Question = "Match the words",
            Data = JsonSerializer.Serialize(new[]
            {
                new { left = "Yes, I do", right = "Так, я люблю" },
                new { left = "Yes, I do", right = "Так, я читаю" }
            }),
            CorrectAnswer = string.Empty,
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
                new SubmitExerciseAnswerRequest
                {
                    ExerciseId = 1,
                    Answer = JsonSerializer.Serialize(new[]
                    {
                        new { leftIndex = 0, rightIndex = 1, left = "Yes, I do", right = "Так, я читаю" },
                        new { leftIndex = 1, rightIndex = 0, left = "Yes, I do", right = "Так, я люблю" }
                    })
                }
            }
        });

        Assert.Equal(1, response.TotalExercises);
        Assert.Equal(1, response.CorrectAnswers);
        Assert.True(response.IsPassed);
        Assert.Empty(response.MistakeExerciseIds);
        Assert.Single(response.Answers);
        Assert.True(response.Answers[0].IsCorrect);
    }


    [Fact]
    public void SubmitLesson_WhenMatchHasDuplicateLeftTexts_AndOnePairIsWrong_ShouldStayIncorrect()
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
            Type = ExerciseType.Match,
            Question = "Match the words",
            Data = JsonSerializer.Serialize(new[]
            {
                new { left = "Yes, I do", right = "Так, я люблю" },
                new { left = "No, I don't", right = "Ні, я не люблю" },
                new { left = "Yes, I do", right = "Так, я читаю" },
                new { left = "No, I don't", right = "Ні, я не читаю" }
            }),
            CorrectAnswer = string.Empty,
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
                new SubmitExerciseAnswerRequest
                {
                    ExerciseId = 1,
                    Answer = JsonSerializer.Serialize(new[]
                    {
                        new { leftIndex = 0, rightIndex = 0, left = "Yes, I do", right = "Так, я люблю" },
                        new { leftIndex = 1, rightIndex = 3, left = "No, I don't", right = "Ні, я не читаю" },
                        new { leftIndex = 2, rightIndex = 1, left = "Yes, I do", right = "Ні, я не люблю" },
                        new { leftIndex = 3, rightIndex = 2, left = "No, I don't", right = "Так, я читаю" }
                    })
                }
            }
        });

        Assert.Equal(1, response.TotalExercises);
        Assert.Equal(0, response.CorrectAnswers);
        Assert.False(response.IsPassed);
        Assert.Single(response.MistakeExerciseIds);
        Assert.Contains(1, response.MistakeExerciseIds);
        Assert.Single(response.Answers);
        Assert.False(response.Answers[0].IsCorrect);
    }

    [Fact]
    public void SubmitLessonMistakes_WhenMatchHasDuplicateLeftTexts_AndPairsAreSwappedByIndex_ShouldBeCompleted()
    {
        var dbContext = TestDbContextFactory.Create();

        SeedLessonBase(dbContext, lessonId: 1, isUnlocked: true);

        dbContext.Exercises.Add(new Exercise
        {
            Id = 10,
            LessonId = 1,
            Order = 1,
            Type = ExerciseType.Match,
            Question = "Match the words",
            CorrectAnswer = string.Empty,
            Data = JsonSerializer.Serialize(new[]
            {
                new { left = "Yes, I do", right = "Так, я люблю" },
                new { left = "Yes, I do", right = "Так, я читаю" }
            })
        });

        var details = new LessonResultDetailsJson
        {
            MistakeExerciseIds = new() { 10 },
            Answers = new()
            {
                new LessonAnswerResultDto { ExerciseId = 10, UserAnswer = string.Empty, CorrectAnswer = string.Empty, IsCorrect = false }
            }
        };

        dbContext.LessonResults.Add(new LessonResult
        {
            Id = 1,
            UserId = 1,
            LessonId = 1,
            Score = 0,
            TotalQuestions = 1,
            CompletedAt = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc),
            MistakesJson = JsonSerializer.Serialize(details)
        });

        dbContext.SaveChanges();

        var service = new LessonMistakesService(
            dbContext,
            new FakeAchievementService(),
            new FixedDateTimeProvider(new DateTime(2026, 2, 16, 12, 0, 0, DateTimeKind.Utc)),
            Options.Create(new LearningSettings
            {
                PassingScorePercent = 80,
                SceneUnlockEveryLessons = 1
            }),
            new FakeUserEconomyService()
        );

        var response = service.SubmitLessonMistakes(userId: 1, lessonId: 1, new SubmitLessonMistakesRequest
        {
            Answers = new()
            {
                new SubmitExerciseAnswerRequest
                {
                    ExerciseId = 10,
                    Answer = JsonSerializer.Serialize(new[]
                    {
                        new { leftIndex = 0, rightIndex = 1, left = "Yes, I do", right = "Так, я читаю" },
                        new { leftIndex = 1, rightIndex = 0, left = "Yes, I do", right = "Так, я люблю" }
                    })
                }
            }
        });

        Assert.True(response.IsCompleted);
        Assert.Empty(response.MistakeExerciseIds);
        Assert.Equal(1, response.TotalExercises);
        Assert.Equal(1, response.CorrectAnswers);
    }

    private static void SeedLessonBase(Lumino.Api.Data.LuminoDbContext dbContext, int lessonId, bool isUnlocked)
    {
        if (!dbContext.Courses.Any(x => x.Id == 1))
        {
            dbContext.Courses.Add(new Course
            {
                Id = 1,
                Title = "Course",
                Description = "Desc",
                IsPublished = true
            });
        }

        if (!dbContext.Topics.Any(x => x.Id == 1))
        {
            dbContext.Topics.Add(new Topic
            {
                Id = 1,
                CourseId = 1,
                Title = "Topic",
                Order = 1
            });
        }

        if (!dbContext.Lessons.Any(x => x.Id == lessonId))
        {
            dbContext.Lessons.Add(new Lesson
            {
                Id = lessonId,
                TopicId = 1,
                Title = "Lesson",
                Theory = "Theory",
                Order = 1
            });
        }

        if (!dbContext.UserLessonProgresses.Any(x => x.UserId == 1 && x.LessonId == lessonId))
        {
            dbContext.UserLessonProgresses.Add(new UserLessonProgress
            {
                UserId = 1,
                LessonId = lessonId,
                IsUnlocked = isUnlocked,
                IsCompleted = false,
                BestScore = 0,
                LastAttemptAt = DateTime.UtcNow
            });
        }
    }
}
