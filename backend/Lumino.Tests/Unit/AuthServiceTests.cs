using System.IdentityModel.Tokens.Jwt;
using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Application.Validators;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Xunit;
using Lumino.Tests.Stubs;

namespace Lumino.Tests;

public class AuthServiceTests
{
    [Fact]
    public void Register_ShouldCreateUser_AndRequireEmailVerification()
    {
        var dbContext = TestDbContextFactory.Create();
        var configuration = TestConfigurationFactory.Create();

        var emailSender = new FakeEmailSender();

        var service = new AuthService(
            dbContext,
            configuration,
            new FakeRegisterValidator(),
            new FakeLoginValidator(),
            new ForgotPasswordRequestValidator(),
            new ResetPasswordRequestValidator(),
            new VerifyEmailRequestValidator(),
            new ResendVerificationRequestValidator(),
            emailSender,
            new FakeOpenIdTokenValidator(),
            new FakeHostEnvironment(),
            new PasswordHasher()
        );

        var response = service.Register(new RegisterRequest
        {
            Email = "test@mail.com",
            Password = "123456"
        });

        Assert.True(response.RequiresEmailVerification);
        Assert.True(string.IsNullOrWhiteSpace(response.Token));
        Assert.True(string.IsNullOrWhiteSpace(response.RefreshToken));

        Assert.Equal(1, emailSender.SendCallsCount);

        var user = dbContext.Users.FirstOrDefault(x => x.Email == "test@mail.com");
        Assert.NotNull(user);
        Assert.False(string.IsNullOrWhiteSpace(user!.PasswordHash));
        Assert.False(user.IsEmailVerified);
    }

    [Fact]
    public void Register_DuplicateEmail_ShouldThrow()
    {
        var dbContext = TestDbContextFactory.Create();
        var configuration = TestConfigurationFactory.Create();

        dbContext.Users.Add(new User
        {
            Email = "test@mail.com",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            IsEmailVerified = true
        });

        dbContext.SaveChanges();

        var service = new AuthService(
            dbContext,
            configuration,
            new FakeRegisterValidator(),
            new FakeLoginValidator(),
            new ForgotPasswordRequestValidator(),
            new ResetPasswordRequestValidator(),
            new VerifyEmailRequestValidator(),
            new ResendVerificationRequestValidator(),
            new FakeEmailSender(),
            new FakeOpenIdTokenValidator(),
            new FakeHostEnvironment(),
            new PasswordHasher()
        );

        Assert.Throws<ConflictException>(() =>
        {
            service.Register(new RegisterRequest
            {
                Email = "test@mail.com",
                Password = "123456"
            });
        });
    }

    
    [Fact]
    public void Register_ShouldSaveLanguages_WhenProvided()
    {
        var dbContext = TestDbContextFactory.Create();
        var configuration = TestConfigurationFactory.Create();

        var emailSender = new FakeEmailSender();

        var service = new AuthService(
            dbContext,
            configuration,
            new FakeRegisterValidator(),
            new FakeLoginValidator(),
            new ForgotPasswordRequestValidator(),
            new ResetPasswordRequestValidator(),
            new VerifyEmailRequestValidator(),
            new ResendVerificationRequestValidator(),
            emailSender,
            new FakeOpenIdTokenValidator(),
            new FakeHostEnvironment(),
            new PasswordHasher()
        );

        service.Register(new RegisterRequest
        {
            Email = "lang@mail.com",
            Password = "123456",
            NativeLanguageCode = "uk",
            TargetLanguageCode = "en"
        });

        var user = dbContext.Users.FirstOrDefault(x => x.Email == "lang@mail.com");
        Assert.NotNull(user);
        Assert.Equal("uk", user!.NativeLanguageCode);
        Assert.Equal("en", user.TargetLanguageCode);
    }

    [Fact]
    public void Register_WithoutTargetLanguage_ShouldUseDefaultEnglish()
    {
        var dbContext = TestDbContextFactory.Create();
        var configuration = TestConfigurationFactory.Create();

        var service = new AuthService(
            dbContext,
            configuration,
            new FakeRegisterValidator(),
            new FakeLoginValidator(),
            new ForgotPasswordRequestValidator(),
            new ResetPasswordRequestValidator(),
            new VerifyEmailRequestValidator(),
            new ResendVerificationRequestValidator(),
            new FakeEmailSender(),
            new FakeOpenIdTokenValidator(),
            new FakeHostEnvironment(),
            new PasswordHasher()
        );

        service.Register(new RegisterRequest
        {
            Email = "defaultlang@mail.com",
            Password = "123456"
        });

        var user = dbContext.Users.FirstOrDefault(x => x.Email == "defaultlang@mail.com");
        Assert.NotNull(user);
        Assert.Equal("en", user!.TargetLanguageCode);
    }


    [Fact]
    public void Register_ShouldSeedLessonProgress_ForActiveCourse()
    {
        var dbContext = TestDbContextFactory.Create();
        var configuration = TestConfigurationFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "English A1",
            Description = "",
            LanguageCode = "en",
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
                TopicId = 1,
                Title = "Lesson 1",
                Theory = "Theory 1",
                Order = 1
            },
            new Lesson
            {
                Id = 2,
                TopicId = 1,
                Title = "Lesson 2",
                Theory = "Theory 2",
                Order = 2
            }
        );

        dbContext.SaveChanges();

        var service = new AuthService(
            dbContext,
            configuration,
            new FakeRegisterValidator(),
            new FakeLoginValidator(),
            new ForgotPasswordRequestValidator(),
            new ResetPasswordRequestValidator(),
            new VerifyEmailRequestValidator(),
            new ResendVerificationRequestValidator(),
            new FakeEmailSender(),
            new FakeOpenIdTokenValidator(),
            new FakeHostEnvironment(),
            new PasswordHasher()
        );

        service.Register(new RegisterRequest
        {
            Email = "progress@mail.com",
            Password = "123456"
        });

        var user = dbContext.Users.First(x => x.Email == "progress@mail.com");
        var progresses = dbContext.UserLessonProgresses
            .Where(x => x.UserId == user.Id)
            .OrderBy(x => x.LessonId)
            .ToList();

        Assert.Equal(2, progresses.Count);
        Assert.True(progresses[0].IsUnlocked);
        Assert.False(progresses[0].IsCompleted);
        Assert.False(progresses[1].IsUnlocked);
        Assert.False(progresses[1].IsCompleted);
    }

    [Fact]
    public void Login_EmailNotVerified_ShouldThrow()
    {
        var dbContext = TestDbContextFactory.Create();
        var configuration = TestConfigurationFactory.Create();

        var emailSender = new FakeEmailSender();

        var service = new AuthService(
            dbContext,
            configuration,
            new FakeRegisterValidator(),
            new FakeLoginValidator(),
            new ForgotPasswordRequestValidator(),
            new ResetPasswordRequestValidator(),
            new VerifyEmailRequestValidator(),
            new ResendVerificationRequestValidator(),
            emailSender,
            new FakeOpenIdTokenValidator(),
            new FakeHostEnvironment(),
            new PasswordHasher()
        );

        service.Register(new RegisterRequest
        {
            Email = "test@mail.com",
            Password = "123456"
        });

        Assert.Throws<EmailNotVerifiedException>(() =>
        {
            service.Login(new LoginRequest
            {
                Email = "test@mail.com",
                Password = "123456"
            });
        });
    }


    [Fact]
    public void Login_BlockedUser_ShouldThrowForbidden()
    {
        var dbContext = TestDbContextFactory.Create();
        var configuration = TestConfigurationFactory.Create();

        dbContext.Users.Add(new User
        {
            Email = "blocked@mail.com",
            PasswordHash = new PasswordHasher().Hash("123456"),
            IsEmailVerified = true,
            Role = Lumino.Api.Domain.Enums.Role.User,
            CreatedAt = DateTime.UtcNow,
            BlockedUntilUtc = DateTime.UtcNow.AddDays(2)
        });

        dbContext.SaveChanges();

        var service = new AuthService(
            dbContext,
            configuration,
            new FakeRegisterValidator(),
            new FakeLoginValidator(),
            new ForgotPasswordRequestValidator(),
            new ResetPasswordRequestValidator(),
            new VerifyEmailRequestValidator(),
            new ResendVerificationRequestValidator(),
            new FakeEmailSender(),
            new FakeOpenIdTokenValidator(),
            new FakeHostEnvironment(),
            new PasswordHasher()
        );

        Assert.Throws<ForbiddenAccessException>(() =>
        {
            service.Login(new LoginRequest
            {
                Email = "blocked@mail.com",
                Password = "123456"
            });
        });
    }

[Fact]
    public void Login_InvalidPassword_ShouldThrow()
    {
        var dbContext = TestDbContextFactory.Create();
        var configuration = TestConfigurationFactory.Create();

        var emailSender = new FakeEmailSender();

        var service = new AuthService(
            dbContext,
            configuration,
            new FakeRegisterValidator(),
            new FakeLoginValidator(),
            new ForgotPasswordRequestValidator(),
            new ResetPasswordRequestValidator(),
            new VerifyEmailRequestValidator(),
            new ResendVerificationRequestValidator(),
            emailSender,
            new FakeOpenIdTokenValidator(),
            new FakeHostEnvironment(),
            new PasswordHasher()
        );

        service.Register(new RegisterRequest
        {
            Email = "test@mail.com",
            Password = "123456"
        });

        var user = dbContext.Users.First(x => x.Email == "test@mail.com");
        user.IsEmailVerified = true;
        dbContext.SaveChanges();

        Assert.Throws<UnauthorizedAccessException>(() =>
        {
            service.Login(new LoginRequest
            {
                Email = "test@mail.com",
                Password = "WRONG_PASSWORD"
            });
        });
    }

    [Fact]
    public void Login_Admin_ShouldClearLearningState_AndIssueCurrentSessionVersion()
    {
        var dbContext = TestDbContextFactory.Create();
        var configuration = TestConfigurationFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 10,
            Title = "English A1",
            Description = "Desc",
            LanguageCode = "en",
            IsPublished = true
        });

        var admin = new User
        {
            Id = 1,
            Email = "admin@lumino.local",
            PasswordHash = new PasswordHasher().Hash("123456"),
            IsEmailVerified = true,
            Role = Lumino.Api.Domain.Enums.Role.Admin,
            CreatedAt = DateTime.UtcNow,
            NativeLanguageCode = "uk",
            TargetLanguageCode = "en"
        };

        dbContext.Users.Add(admin);
        dbContext.UserCourses.Add(new UserCourse
        {
            UserId = 1,
            CourseId = 10,
            IsActive = true,
            StartedAt = DateTime.UtcNow,
            LastOpenedAt = DateTime.UtcNow,
        });
        dbContext.SaveChanges();

        var service = new AuthService(
            dbContext,
            configuration,
            new FakeRegisterValidator(),
            new FakeLoginValidator(),
            new ForgotPasswordRequestValidator(),
            new ResetPasswordRequestValidator(),
            new VerifyEmailRequestValidator(),
            new ResendVerificationRequestValidator(),
            new FakeEmailSender(),
            new FakeOpenIdTokenValidator(),
            new FakeHostEnvironment(),
            new PasswordHasher()
        );

        var response = service.Login(new LoginRequest
        {
            Email = "admin@lumino.local",
            Password = "123456"
        });

        var refreshedAdmin = dbContext.Users.Single(x => x.Id == 1);
        Assert.Null(refreshedAdmin.NativeLanguageCode);
        Assert.Null(refreshedAdmin.TargetLanguageCode);
        Assert.Empty(dbContext.UserCourses.Where(x => x.UserId == 1).ToList());
        Assert.Equal(1, refreshedAdmin.SessionVersion);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(response.Token);
        Assert.Equal("1", jwt.Claims.First(x => x.Type == ClaimsUtils.SessionVersionClaimType).Value);
    }

}
