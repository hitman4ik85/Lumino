using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;
using Lumino.Api.Utils;
using Xunit;

namespace Lumino.Tests;

public class AdminUserServiceTests
{
    [Fact]
    public void GetAll_ReturnsUsersOrderedAlphabetically_AndMapsPointsCoursesAndPrimaryAdmin()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.AddRange(
            new Course
            {
                Id = 10,
                Title = "English A1",
                Description = "Desc",
                LanguageCode = "en",
                IsPublished = true
            },
            new Course
            {
                Id = 20,
                Title = "French A1",
                Description = "Desc",
                LanguageCode = "fr",
                IsPublished = true
            }
        );

        dbContext.Users.AddRange(
            new User
            {
                Id = 1,
                Username = "Marta",
                Email = "marta@mail.com",
                PasswordHash = "hash",
                Role = Role.User,
                Crystals = 50,
                BlockedUntilUtc = DateTime.UtcNow.AddDays(3),
                CreatedAt = new DateTime(2026, 4, 1, 10, 0, 0, DateTimeKind.Utc),
                Theme = "dark"
            },
            new User
            {
                Id = 2,
                Username = "Bohdan",
                Email = "bohdan@mail.com",
                PasswordHash = "hash",
                Role = Role.User,
                Crystals = 10,
                CreatedAt = new DateTime(2026, 4, 2, 10, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Id = 3,
                Email = "admin@lumino.local",
                PasswordHash = "hash",
                Role = Role.Admin,
                Crystals = 999,
                CreatedAt = new DateTime(2026, 4, 3, 10, 0, 0, DateTimeKind.Utc)
            }
        );

        dbContext.UserProgresses.AddRange(
            new UserProgress
            {
                UserId = 1,
                TotalScore = 120,
                LastUpdatedAt = DateTime.UtcNow
            },
            new UserProgress
            {
                UserId = 2,
                TotalScore = 70,
                LastUpdatedAt = DateTime.UtcNow
            }
        );

        dbContext.UserCourses.AddRange(
            new UserCourse
            {
                UserId = 1,
                CourseId = 20,
                IsActive = false,
                StartedAt = DateTime.UtcNow,
                LastOpenedAt = new DateTime(2026, 4, 1, 9, 0, 0, DateTimeKind.Utc)
            },
            new UserCourse
            {
                UserId = 1,
                CourseId = 10,
                IsActive = true,
                StartedAt = DateTime.UtcNow,
                LastOpenedAt = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc)
            },
            new UserCourse
            {
                UserId = 2,
                CourseId = 20,
                IsActive = true,
                StartedAt = DateTime.UtcNow,
                LastOpenedAt = new DateTime(2026, 4, 2, 12, 0, 0, DateTimeKind.Utc)
            }
        );

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var result = service.GetAll();

        Assert.Equal(3, result.Count);

        Assert.Equal(3, result[0].Id);
        Assert.True(result[0].IsPrimaryAdmin);
        Assert.Equal("Admin", result[0].Role);
        Assert.Equal("light", result[0].Theme);
        Assert.Empty(result[0].CourseIds);
        Assert.Null(result[0].ActiveCourseId);
        Assert.Equal(0, result[0].Points);
        Assert.Null(result[0].NativeLanguageCode);
        Assert.Null(result[0].TargetLanguageCode);
        Assert.Equal(0, result[0].Crystals);
        Assert.Equal(0, result[0].Hearts);

        Assert.Equal(2, result[1].Id);
        Assert.Equal("Bohdan", result[1].Username);
        Assert.Equal(70, result[1].Points);
        Assert.Equal(new[] { 20 }, result[1].CourseIds);
        Assert.Equal(20, result[1].ActiveCourseId);

        Assert.Equal(1, result[2].Id);
        Assert.Equal("Marta", result[2].Username);
        Assert.Equal(120, result[2].Points);
        Assert.Equal(new[] { 10, 20 }, result[2].CourseIds);
        Assert.Equal(10, result[2].ActiveCourseId);
        Assert.Equal("dark", result[2].Theme);
        Assert.True(result[2].IsBlocked);
        Assert.NotNull(result[2].BlockedUntilUtc);
    }

    [Fact]
    public void Create_CreatesRegularUser_WithProgressAndActiveCourse()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.AddRange(
            new Course
            {
                Id = 10,
                Title = "English A1",
                Description = "Desc",
                LanguageCode = "en",
                IsPublished = true
            },
            new Course
            {
                Id = 20,
                Title = "French A1",
                Description = "Desc",
                LanguageCode = "fr",
                IsPublished = true
            }
        );

        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "admin@lumino.local",
            PasswordHash = "hash",
            Role = Role.Admin,
            CreatedAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var request = new AdminUserUpsertRequest
        {
            Username = "new user",
            Email = "newuser@mail.com",
            Password = "abc12345",
            Role = "User",
            Hearts = 4,
            Crystals = 15,
            Points = 320,
            BlockedUntilUtc = DateTime.UtcNow.AddDays(2),
            CourseIds = new List<int> { 20, 10, 20 },
            ActiveCourseId = 20,
            Theme = "dark",
            IsEmailVerified = true
        };

        var result = service.Create(request, 1);

        var user = dbContext.Users.Single(x => x.Id == result.Id);
        var progress = dbContext.UserProgresses.Single(x => x.UserId == user.Id);
        var userCourses = dbContext.UserCourses.Where(x => x.UserId == user.Id).OrderBy(x => x.CourseId).ToList();

        Assert.Equal("new user", user.Username);
        Assert.Equal("newuser@mail.com", user.Email);
        Assert.Equal(Role.User, user.Role);
        Assert.True(user.IsEmailVerified);
        Assert.Equal(4, user.Hearts);
        Assert.Equal(15, user.Crystals);
        Assert.Equal("dark", user.Theme);
        Assert.NotNull(user.BlockedUntilUtc);
        Assert.Equal("uk", user.NativeLanguageCode);
        Assert.Equal("fr", user.TargetLanguageCode);
        Assert.True(new PasswordHasher().Verify("abc12345", user.PasswordHash));

        Assert.Equal(320, progress.TotalScore);

        Assert.Equal(2, userCourses.Count);
        Assert.Equal(10, userCourses[0].CourseId);
        Assert.False(userCourses[0].IsActive);
        Assert.Equal(20, userCourses[1].CourseId);
        Assert.True(userCourses[1].IsActive);

        Assert.Equal(new[] { 10, 20 }, result.CourseIds);
        Assert.Equal(20, result.ActiveCourseId);
        Assert.Equal(320, result.Points);
        Assert.True(result.IsBlocked);
        Assert.NotNull(result.BlockedUntilUtc);
        Assert.False(result.IsPrimaryAdmin);
    }

    [Fact]
    public void Create_Throws_WhenSecondaryAdminCreatesAnotherAdmin()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.AddRange(
            new User
            {
                Id = 1,
                Email = "admin-secondary@mail.com",
                PasswordHash = "hash",
                Role = Role.Admin,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Email = "user@mail.com",
                PasswordHash = "hash",
                Role = Role.User,
                CreatedAt = DateTime.UtcNow
            }
        );

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var request = new AdminUserUpsertRequest
        {
            Username = "newadmin",
            Email = "newadmin@mail.com",
            Password = "abc12345",
            Role = "Admin"
        };

        Assert.Throws<ForbiddenAccessException>(() => service.Create(request, 1));
    }

    [Fact]
    public void Update_UpdatesUserData_AndReplacesCoursesAndPoints()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.AddRange(
            new Course
            {
                Id = 10,
                Title = "English A1",
                Description = "Desc",
                LanguageCode = "en",
                IsPublished = true
            },
            new Course
            {
                Id = 20,
                Title = "French A1",
                Description = "Desc",
                LanguageCode = "fr",
                IsPublished = true
            }
        );

        dbContext.Users.AddRange(
            new User
            {
                Id = 1,
                Email = "admin@lumino.local",
                PasswordHash = "hash",
                Role = Role.Admin,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Username = "oldname",
                Email = "user@mail.com",
                PasswordHash = new PasswordHasher().Hash("oldpass"),
                Role = Role.User,
                NativeLanguageCode = "uk",
                TargetLanguageCode = "en",
                Hearts = 5,
                Crystals = 10,
                Theme = "light",
                CreatedAt = DateTime.UtcNow
            }
        );

        dbContext.UserProgresses.Add(new UserProgress
        {
            UserId = 2,
            TotalScore = 25,
            LastUpdatedAt = DateTime.UtcNow
        });

        dbContext.UserCourses.Add(new UserCourse
        {
            UserId = 2,
            CourseId = 10,
            IsActive = true,
            StartedAt = DateTime.UtcNow,
            LastOpenedAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var request = new AdminUserUpsertRequest
        {
            Username = "updated name",
            Email = "updated@mail.com",
            Password = "newpass123",
            Hearts = 3,
            Crystals = 99,
            Points = 500,
            BlockedUntilUtc = DateTime.UtcNow.AddHours(12),
            Theme = "dark",
            CourseIds = new List<int> { 20 },
            ActiveCourseId = 20,
            Role = "User",
            IsEmailVerified = false,
            AvatarUrl = "/avatars/alien-2.png"
        };

        var result = service.Update(2, request, 1);

        var user = dbContext.Users.Single(x => x.Id == 2);
        var progress = dbContext.UserProgresses.Single(x => x.UserId == 2);
        var userCourses = dbContext.UserCourses.Where(x => x.UserId == 2).OrderBy(x => x.CourseId).ToList();

        Assert.Equal("updated name", user.Username);
        Assert.Equal("updated@mail.com", user.Email);
        Assert.False(user.IsEmailVerified);
        Assert.Equal(3, user.Hearts);
        Assert.Equal(99, user.Crystals);
        Assert.Equal("dark", user.Theme);
        Assert.NotNull(user.BlockedUntilUtc);
        Assert.Equal("/avatars/alien-2.png", user.AvatarUrl);
        Assert.Equal("uk", user.NativeLanguageCode);
        Assert.Equal("fr", user.TargetLanguageCode);
        Assert.True(new PasswordHasher().Verify("newpass123", user.PasswordHash));

        Assert.Equal(500, progress.TotalScore);
        Assert.Single(userCourses);
        Assert.Equal(20, userCourses[0].CourseId);
        Assert.True(userCourses[0].IsActive);

        Assert.Equal(500, result.Points);
        Assert.Equal(new[] { 20 }, result.CourseIds);
        Assert.Equal(20, result.ActiveCourseId);
        Assert.True(result.IsBlocked);
        Assert.NotNull(result.BlockedUntilUtc);
    }

    [Fact]
    public void Update_Throws_WhenSecondaryAdminTriesToEditAnotherAdmin()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.AddRange(
            new User
            {
                Id = 1,
                Email = "admin-secondary@mail.com",
                PasswordHash = "hash",
                Role = Role.Admin,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Email = "another-admin@mail.com",
                PasswordHash = "hash",
                Role = Role.Admin,
                CreatedAt = DateTime.UtcNow
            }
        );

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var request = new AdminUserUpsertRequest
        {
            Username = "updated",
            Email = "another-admin@mail.com",
            Role = "Admin"
        };

        Assert.Throws<ForbiddenAccessException>(() => service.Update(2, request, 1));
    }

    [Fact]
    public void Update_Throws_WhenTryingToChangePrimaryAdminEmail()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "admin@lumino.local",
            PasswordHash = "hash",
            Role = Role.Admin,
            CreatedAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var request = new AdminUserUpsertRequest
        {
            Username = "mainadmin",
            Email = "changed-admin@mail.com",
            Role = "Admin"
        };

        Assert.Throws<ForbiddenAccessException>(() => service.Update(1, request, 1));
    }


    [Fact]
    public void Update_Throws_WhenTryingToBlockCurrentAdmin()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "admin@lumino.local",
            PasswordHash = "hash",
            Role = Role.Admin,
            CreatedAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var request = new AdminUserUpsertRequest
        {
            Username = "Main Admin",
            Email = "admin@lumino.local",
            Role = "Admin",
            BlockedUntilUtc = DateTime.UtcNow.AddDays(1)
        };

        Assert.Throws<ForbiddenAccessException>(() => service.Update(1, request, 1));
    }

    [Fact]
    public void Delete_RemovesRegularUser()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.AddRange(
            new User
            {
                Id = 1,
                Email = "admin@lumino.local",
                PasswordHash = "hash",
                Role = Role.Admin,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Email = "user@mail.com",
                PasswordHash = "hash",
                Role = Role.User,
                CreatedAt = DateTime.UtcNow
            }
        );

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        service.Delete(2, 1);

        Assert.Single(dbContext.Users);
        Assert.Equal(1, dbContext.Users.Single().Id);
    }

    [Fact]
    public void Delete_Throws_WhenTryingToDeletePrimaryAdmin()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.AddRange(
            new User
            {
                Id = 1,
                Email = "admin-secondary@mail.com",
                PasswordHash = "hash",
                Role = Role.Admin,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Email = "admin@lumino.local",
                PasswordHash = "hash",
                Role = Role.Admin,
                CreatedAt = DateTime.UtcNow
            }
        );

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        Assert.Throws<ForbiddenAccessException>(() => service.Delete(2, 1));
    }

    [Fact]
    public void Delete_Throws_WhenTryingToDeleteCurrentAdmin()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "admin@lumino.local",
            PasswordHash = "hash",
            Role = Role.Admin,
            CreatedAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        Assert.Throws<ForbiddenAccessException>(() => service.Delete(1, 1));
    }


    [Fact]
    public void Create_Admin_ShouldIgnoreLanguagesAndCourses()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 10,
            Title = "English A1",
            Description = "Desc",
            LanguageCode = "en",
            IsPublished = true
        });

        dbContext.Users.Add(new User
        {
            Id = 1,
            Email = "admin@lumino.local",
            PasswordHash = "hash",
            Role = Role.Admin,
            CreatedAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var result = service.Create(new AdminUserUpsertRequest
        {
            Username = "content-admin",
            Email = "content-admin@mail.com",
            Password = "abc12345",
            Role = "Admin",
            NativeLanguageCode = "uk",
            TargetLanguageCode = "en",
            CourseIds = new List<int> { 10 },
            ActiveCourseId = 10,
        }, 1);

        var created = dbContext.Users.Single(x => x.Id == result.Id);

        Assert.Equal(Role.Admin, created.Role);
        Assert.Null(created.NativeLanguageCode);
        Assert.Null(created.TargetLanguageCode);
        Assert.Empty(dbContext.UserCourses.Where(x => x.UserId == created.Id).ToList());
        Assert.Empty(result.CourseIds);
        Assert.Null(result.ActiveCourseId);
        Assert.Equal(0, created.Hearts);
        Assert.Equal(0, created.Crystals);
        Assert.Equal(0, result.Points);
    }

    [Fact]
    public void Update_ToAdmin_ShouldClearLanguagesCourses_AndInvalidateSessions()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Courses.Add(new Course
        {
            Id = 10,
            Title = "English A1",
            Description = "Desc",
            LanguageCode = "en",
            IsPublished = true
        });

        dbContext.Users.AddRange(
            new User
            {
                Id = 1,
                Email = "admin@lumino.local",
                PasswordHash = "hash",
                Role = Role.Admin,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Email = "editor@mail.com",
                PasswordHash = "hash",
                Role = Role.User,
                CreatedAt = DateTime.UtcNow,
                NativeLanguageCode = "uk",
                TargetLanguageCode = "en",
                SessionVersion = 2,
            }
        );

        dbContext.UserCourses.Add(new UserCourse
        {
            UserId = 2,
            CourseId = 10,
            IsActive = true,
            StartedAt = DateTime.UtcNow,
            LastOpenedAt = DateTime.UtcNow
        });

        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = 2,
            TokenHash = "token-hash",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var result = service.Update(2, new AdminUserUpsertRequest
        {
            Username = "editor",
            Email = "editor@mail.com",
            Role = "Admin",
            IsEmailVerified = true,
            Hearts = 5,
            Crystals = 0,
            Theme = "light",
            NativeLanguageCode = "uk",
            TargetLanguageCode = "en",
            CourseIds = new List<int> { 10 },
            ActiveCourseId = 10,
        }, 1);

        var updated = dbContext.Users.Single(x => x.Id == 2);
        var refreshToken = dbContext.RefreshTokens.Single(x => x.UserId == 2);

        Assert.Equal(Role.Admin, updated.Role);
        Assert.Null(updated.NativeLanguageCode);
        Assert.Null(updated.TargetLanguageCode);
        Assert.Empty(dbContext.UserCourses.Where(x => x.UserId == 2).ToList());
        Assert.Equal(3, updated.SessionVersion);
        Assert.NotNull(refreshToken.RevokedAt);
        Assert.Empty(result.CourseIds);
        Assert.Null(result.ActiveCourseId);
        Assert.Equal(0, updated.Hearts);
        Assert.Equal(0, updated.Crystals);
        Assert.Equal(0, result.Points);
    }


    [Fact]
    public void Update_PartialRequest_ShouldChangeOnlyProvidedField_AndKeepExternalAvatar()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.AddRange(
            new User
            {
                Id = 1,
                Email = "admin@lumino.local",
                PasswordHash = "hash",
                Role = Role.Admin,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Username = "google user",
                Email = "google-user@mail.com",
                PasswordHash = "hash",
                Role = Role.User,
                AvatarUrl = "https://lh3.googleusercontent.com/avatar-from-google",
                Hearts = 2,
                Crystals = 15,
                Theme = "dark",
                NativeLanguageCode = "uk",
                TargetLanguageCode = "en",
                IsEmailVerified = true,
                CreatedAt = DateTime.UtcNow
            }
        );

        dbContext.UserProgresses.Add(new UserProgress
        {
            UserId = 2,
            TotalScore = 90,
            LastUpdatedAt = DateTime.UtcNow
        });

        dbContext.SaveChanges();

        var service = CreateService(dbContext);
        var request = new AdminUserUpsertRequest
        {
            Hearts = 4,
            ProvidedFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                nameof(AdminUserUpsertRequest.Hearts)
            }
        };

        var result = service.Update(2, request, 1);
        var updated = dbContext.Users.Single(x => x.Id == 2);

        Assert.Equal(4, updated.Hearts);
        Assert.Equal("google user", updated.Username);
        Assert.Equal("google-user@mail.com", updated.Email);
        Assert.Equal("https://lh3.googleusercontent.com/avatar-from-google", updated.AvatarUrl);
        Assert.Equal(15, updated.Crystals);
        Assert.Equal("dark", updated.Theme);
        Assert.Equal(90, result.Points);
    }

    [Fact]
    public void Update_WithUnchangedExternalAvatar_ShouldAllowSavingOtherFields()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.AddRange(
            new User
            {
                Id = 1,
                Email = "admin@lumino.local",
                PasswordHash = "hash",
                Role = Role.Admin,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Username = "google user",
                Email = "google-user@mail.com",
                PasswordHash = "hash",
                Role = Role.User,
                AvatarUrl = "https://lh3.googleusercontent.com/avatar-from-google",
                Hearts = 2,
                Crystals = 15,
                Theme = "dark",
                NativeLanguageCode = "uk",
                TargetLanguageCode = "en",
                IsEmailVerified = true,
                CreatedAt = DateTime.UtcNow
            }
        );

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var result = service.Update(2, new AdminUserUpsertRequest
        {
            Username = "google user",
            Email = "google-user@mail.com",
            Role = "User",
            Theme = "light",
            AvatarUrl = "https://lh3.googleusercontent.com/avatar-from-google",
            Hearts = 2,
            Crystals = 15,
            IsEmailVerified = true,
            NativeLanguageCode = "uk",
            TargetLanguageCode = "en",
        }, 1);

        Assert.Equal("https://lh3.googleusercontent.com/avatar-from-google", result.AvatarUrl);
        Assert.Equal("light", result.Theme);
    }

    [Fact]
    public void Update_Throws_WhenHeartsAreGreaterThanFive()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.Users.AddRange(
            new User
            {
                Id = 1,
                Email = "admin@lumino.local",
                PasswordHash = "hash",
                Role = Role.Admin,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Username = "user",
                Email = "user@mail.com",
                PasswordHash = "hash",
                Role = Role.User,
                Hearts = 3,
                Theme = "light",
                CreatedAt = DateTime.UtcNow
            }
        );

        dbContext.SaveChanges();

        var service = CreateService(dbContext);

        var ex = Assert.Throws<ArgumentException>(() => service.Update(2, new AdminUserUpsertRequest
        {
            Username = "user",
            Email = "user@mail.com",
            Role = "User",
            Hearts = 6,
            Theme = "light"
        }, 1));

        Assert.Contains("Hearts must be between 0 and 5", ex.Message);
    }


    private static AdminUserService CreateService(Lumino.Api.Data.LuminoDbContext dbContext)
    {
        return new AdminUserService(
            dbContext,
            TestConfigurationFactory.Create(),
            new PasswordHasher());
    }
}
