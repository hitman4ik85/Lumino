using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Application.Validators;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Xunit;

namespace Lumino.Tests;

public class UserAccountServiceDeleteAccountTests
{
    [Fact]
    public void DeleteAccount_WhenUserHasPasswordAndPasswordIsCorrect_ShouldDeleteUser()
    {
        using var dbContext = TestDbContextFactory.Create();
        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "user1@mail.com",
            PasswordHash = "hash:123456"
        });
        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var request = new DeleteAccountRequest
        {
            Password = "123456"
        };

        service.DeleteAccount(1, request);

        Assert.False(dbContext.Users.Any(x => x.Id == 1));
    }

    [Fact]
    public void DeleteAccount_WhenUserHasPasswordAndPasswordIsEmpty_ShouldThrow()
    {
        using var dbContext = TestDbContextFactory.Create();
        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "user2@mail.com",
            PasswordHash = "hash:123456"
        });
        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var request = new DeleteAccountRequest();

        Assert.Throws<ArgumentException>(() => service.DeleteAccount(1, request));
    }

    [Fact]
    public void DeleteAccount_WhenUserHasPasswordAndPasswordIsInvalid_ShouldThrow()
    {
        using var dbContext = TestDbContextFactory.Create();
        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "user3@mail.com",
            PasswordHash = "hash:123456"
        });
        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var request = new DeleteAccountRequest
        {
            Password = "654321"
        };

        Assert.Throws<UnauthorizedAccessException>(() => service.DeleteAccount(1, request));
    }

    [Fact]
    public void DeleteAccount_WhenUserIsGoogleOnlyAndPasswordIsEmpty_ShouldDeleteUser()
    {
        using var dbContext = TestDbContextFactory.Create();
        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "user4@mail.com",
            PasswordHash = string.Empty
        });
        dbContext.UserExternalLogins.Add(new UserExternalLogin
        {
            UserId = 1,
            Provider = "google",
            ProviderUserId = "google-1"
        });
        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var request = new DeleteAccountRequest();

        service.DeleteAccount(1, request);

        Assert.False(dbContext.Users.Any(x => x.Id == 1));
    }

    [Fact]
    public void DeleteAccount_WhenUserIsGoogleOnlyAndPasswordHashExists_ShouldDeleteUser()
    {
        using var dbContext = TestDbContextFactory.Create();
        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "user4_google@mail.com",
            PasswordHash = "hash:generated-random-password"
        });
        dbContext.UserExternalLogins.Add(new UserExternalLogin
        {
            UserId = 1,
            Provider = "google",
            ProviderUserId = "google-2"
        });
        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var request = new DeleteAccountRequest();

        service.DeleteAccount(1, request);

        Assert.False(dbContext.Users.Any(x => x.Id == 1));
    }

    [Fact]
    public void DeleteAccount_WhenUserHasNoPasswordAndNoGoogleLogin_ShouldThrow()
    {
        using var dbContext = TestDbContextFactory.Create();
        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "user5@mail.com",
            PasswordHash = string.Empty
        });
        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var request = new DeleteAccountRequest();

        Assert.Throws<UnauthorizedAccessException>(() => service.DeleteAccount(1, request));
    }


    [Fact]
    public void DeleteAccount_WhenUserHasRelatedData_ShouldDeleteAllUserRelations()
    {
        using var dbContext = TestDbContextFactory.Create();

        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "user6@mail.com",
            PasswordHash = "hash:123456",
            CreatedAt = DateTime.UtcNow,
            Theme = "light"
        });

        dbContext.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            UserId = 1,
            TokenHash = "email-token",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        });

        dbContext.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = 1,
            TokenHash = "reset-token",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        });

        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = 1,
            TokenHash = "refresh-token",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        });

        dbContext.UserExternalLogins.Add(new UserExternalLogin
        {
            UserId = 1,
            Provider = "google",
            ProviderUserId = "google-6",
            Email = "user6@mail.com",
            CreatedAtUtc = DateTime.UtcNow
        });

        dbContext.Courses.Add(new Course
        {
            Id = 100,
            Title = "Course",
            Description = "Desc",
            IsPublished = true,
            LanguageCode = "en"
        });

        dbContext.Topics.Add(new Topic
        {
            Id = 200,
            CourseId = 100,
            Title = "Topic",
            Order = 1
        });

        dbContext.Lessons.Add(new Lesson
        {
            Id = 300,
            TopicId = 200,
            Title = "Lesson",
            Theory = "Theory",
            Order = 1
        });

        dbContext.Achievements.Add(new Achievement
        {
            Id = 400,
            Code = "ach-1",
            Title = "Achievement",
            Description = "Desc"
        });

        dbContext.VocabularyItems.Add(new VocabularyItem
        {
            Id = 500,
            Word = "word",
            Translation = "translation"
        });

        dbContext.UserCourses.Add(new UserCourse
        {
            UserId = 1,
            CourseId = 100,
            IsActive = true,
            StartedAt = DateTime.UtcNow,
            LastOpenedAt = DateTime.UtcNow
        });

        dbContext.UserLessonProgresses.Add(new UserLessonProgress
        {
            UserId = 1,
            LessonId = 300,
            IsUnlocked = true,
            IsCompleted = false,
            BestScore = 1
        });

        dbContext.LessonResults.Add(new LessonResult
        {
            UserId = 1,
            LessonId = 300,
            Score = 1,
            TotalQuestions = 1,
            CompletedAt = DateTime.UtcNow,
            MistakesJson = "[]"
        });

        dbContext.Scenes.Add(new Scene
        {
            Id = 600,
            CourseId = 100,
            Title = "Scene",
            Description = "Desc",
            SceneType = "Dialogue",
            Order = 1
        });

        dbContext.SceneAttempts.Add(new SceneAttempt
        {
            UserId = 1,
            SceneId = 600,
            IsCompleted = false,
            CompletedAt = DateTime.UtcNow,
            Score = 0,
            TotalQuestions = 0
        });

        dbContext.UserAchievements.Add(new UserAchievement
        {
            UserId = 1,
            AchievementId = 400,
            EarnedAt = DateTime.UtcNow
        });

        dbContext.UserVocabularies.Add(new UserVocabulary
        {
            UserId = 1,
            VocabularyItemId = 500,
            AddedAt = DateTime.UtcNow,
            NextReviewAt = DateTime.UtcNow,
            ReviewCount = 0
        });

        dbContext.UserProgresses.Add(new UserProgress
        {
            UserId = 1,
            TotalScore = 10,
            CompletedLessons = 1,
            LastUpdatedAt = DateTime.UtcNow
        });

        dbContext.UserDailyActivities.Add(new UserDailyActivity
        {
            UserId = 1,
            DateUtc = DateTime.UtcNow.Date
        });

        dbContext.UserStreaks.Add(new UserStreak
        {
            UserId = 1,
            CurrentStreak = 1,
            BestStreak = 1,
            LastActivityDateUtc = DateTime.UtcNow.Date
        });

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        service.DeleteAccount(1, new DeleteAccountRequest());

        Assert.False(dbContext.Users.Any(x => x.Id == 1));
        Assert.False(dbContext.EmailVerificationTokens.Any(x => x.UserId == 1));
        Assert.False(dbContext.PasswordResetTokens.Any(x => x.UserId == 1));
        Assert.False(dbContext.RefreshTokens.Any(x => x.UserId == 1));
        Assert.False(dbContext.UserExternalLogins.Any(x => x.UserId == 1));
        Assert.False(dbContext.UserLessonProgresses.Any(x => x.UserId == 1));
        Assert.False(dbContext.UserCourses.Any(x => x.UserId == 1));
        Assert.False(dbContext.LessonResults.Any(x => x.UserId == 1));
        Assert.False(dbContext.SceneAttempts.Any(x => x.UserId == 1));
        Assert.False(dbContext.UserAchievements.Any(x => x.UserId == 1));
        Assert.False(dbContext.UserVocabularies.Any(x => x.UserId == 1));
        Assert.False(dbContext.UserProgresses.Any(x => x.UserId == 1));
        Assert.False(dbContext.UserDailyActivities.Any(x => x.UserId == 1));
        Assert.False(dbContext.UserStreaks.Any(x => x.UserId == 1));
    }

    private static UserAccountService CreateService(Lumino.Api.Data.LuminoDbContext dbContext)
    {
        return new UserAccountService(
            dbContext,
            new FakeChangePasswordRequestValidator(),
            new DeleteAccountRequestValidator(),
            new FakePasswordHasher());
    }

    private class FakeChangePasswordRequestValidator : IChangePasswordRequestValidator
    {
        public void Validate(ChangePasswordRequest request)
        {
        }
    }

    private class FakePasswordHasher : IPasswordHasher
    {
        public string Hash(string password)
        {
            return $"hash:{password}";
        }

        public bool Verify(string password, string passwordHash)
        {
            return passwordHash == $"hash:{password}";
        }

        public bool NeedsRehash(string storedHash)
        {
            return false;
        }
    }
}
