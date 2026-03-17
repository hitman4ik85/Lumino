using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Text.Json;
using Xunit;

namespace Lumino.Tests.Integration.Http
{
    public class OnboardingLanguagesHttpIntegrationTests : IClassFixture<ApiWebApplicationFactory>
    {
        private readonly ApiWebApplicationFactory _factory;

        public OnboardingLanguagesHttpIntegrationTests(ApiWebApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task DeleteLanguage_ShouldRemoveCourse_AndChangeActiveTargetLanguage()
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<LuminoDbContext>();

                dbContext.Database.EnsureDeleted();
                dbContext.Database.EnsureCreated();

                dbContext.Users.Add(new User
                {
                    Id = 10,
                    Email = "lang@test.com",
                    PasswordHash = "hash",
                    CreatedAt = DateTime.UtcNow,
                    NativeLanguageCode = "uk",
                    TargetLanguageCode = "en"
                });

                dbContext.Courses.Add(new Course
                {
                    Id = 1,
                    Title = "English A1",
                    LanguageCode = "en",
                    IsPublished = true
                });

                dbContext.Courses.Add(new Course
                {
                    Id = 2,
                    Title = "German A1",
                    LanguageCode = "de",
                    IsPublished = true
                });

                dbContext.UserCourses.Add(new UserCourse
                {
                    UserId = 10,
                    CourseId = 1,
                    IsActive = true,
                    StartedAt = DateTime.UtcNow,
                    LastOpenedAt = DateTime.UtcNow
                });

                dbContext.UserCourses.Add(new UserCourse
                {
                    UserId = 10,
                    CourseId = 2,
                    IsActive = false,
                    StartedAt = DateTime.UtcNow,
                    LastOpenedAt = DateTime.UtcNow
                });

                dbContext.SaveChanges();
            }

            var client = _factory.CreateClient();

            var response = await client.DeleteAsync("/api/onboarding/languages/me/en");

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

            using (var scope = _factory.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<LuminoDbContext>();
                var user = dbContext.Users.First(x => x.Id == 10);

                Assert.Equal("de", user.TargetLanguageCode);
                Assert.DoesNotContain(dbContext.UserCourses, x => x.UserId == 10 && x.CourseId == 1);
                Assert.Contains(dbContext.UserCourses, x => x.UserId == 10 && x.CourseId == 2);
            }
        }

        [Fact]
        public async Task DeleteLanguage_WhenItIsLastLanguage_ShouldReturnBadRequest_AndKeepLanguage()
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<LuminoDbContext>();

                dbContext.Database.EnsureDeleted();
                dbContext.Database.EnsureCreated();

                dbContext.Users.Add(new User
                {
                    Id = 10,
                    Email = "last-language@test.com",
                    PasswordHash = "hash",
                    CreatedAt = DateTime.UtcNow,
                    NativeLanguageCode = "uk",
                    TargetLanguageCode = "en"
                });

                dbContext.Courses.Add(new Course
                {
                    Id = 1,
                    Title = "English A1",
                    LanguageCode = "en",
                    IsPublished = true
                });

                dbContext.UserCourses.Add(new UserCourse
                {
                    UserId = 10,
                    CourseId = 1,
                    IsActive = true,
                    StartedAt = DateTime.UtcNow,
                    LastOpenedAt = DateTime.UtcNow
                });

                dbContext.SaveChanges();
            }

            var client = _factory.CreateClient();

            var response = await client.DeleteAsync("/api/onboarding/languages/me/en");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadAsStringAsync();

            using (var doc = JsonDocument.Parse(body))
            {
                var root = doc.RootElement;
                var detail = root.GetProperty("detail").GetString() ?? string.Empty;

                Assert.Contains("Не можна видалити останню мову навчання.", detail);
            }

            using (var scope = _factory.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<LuminoDbContext>();
                var user = dbContext.Users.First(x => x.Id == 10);

                Assert.Equal("en", user.TargetLanguageCode);
                Assert.Contains(dbContext.UserCourses, x => x.UserId == 10 && x.CourseId == 1);
            }
        }

    }
}
