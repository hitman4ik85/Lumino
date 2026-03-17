using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using System;
using System.Linq;

namespace Lumino.Api.Application.Services
{
    public class OnboardingService : IOnboardingService
    {
        private readonly LuminoDbContext _dbContext;

        public OnboardingService(LuminoDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public List<LanguageOptionResponse> GetSupportedLanguages()
        {
            return SupportedLanguages.Learnable
                .Select(x => new LanguageOptionResponse
                {
                    Code = x.Code,
                    Title = x.Title
                })
                .ToList();
        }

        public UserLanguagesResponse GetMyLanguages(int userId)
        {
            var user = _dbContext.Users.FirstOrDefault(x => x.Id == userId);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            var result = new UserLanguagesResponse
            {
                NativeLanguageCode = user.NativeLanguageCode,
                ActiveTargetLanguageCode = user.TargetLanguageCode
            };

            var supported = SupportedLanguages.Learnable
                .ToDictionary(x => SupportedLanguages.Normalize(x.Code), x => x.Title);

            var languageCodes = _dbContext.UserCourses
                .Join(_dbContext.Courses,
                    uc => uc.CourseId,
                    c => c.Id,
                    (uc, c) => new { uc.UserId, uc.IsActive, c.LanguageCode })
                .Where(x => x.UserId == userId)
                .AsEnumerable()
                .Select(x => new { Code = SupportedLanguages.Normalize(x.LanguageCode), x.IsActive })
                .GroupBy(x => x.Code)
                .Select(x => new
                {
                    Code = x.Key,
                    IsActive = string.Equals(x.Key, user.TargetLanguageCode, StringComparison.OrdinalIgnoreCase) || x.Any(z => z.IsActive)
                })
                .ToList();

            if (!string.IsNullOrWhiteSpace(user.TargetLanguageCode))
            {
                var active = SupportedLanguages.Normalize(user.TargetLanguageCode);
                if (languageCodes.Any(x => x.Code == active) == false)
                {
                    languageCodes.Add(new { Code = active, IsActive = true });
                }
            }

            foreach (var lang in languageCodes
                .OrderByDescending(x => x.IsActive)
                .ThenBy(x => x.Code))
            {
                if (supported.TryGetValue(lang.Code, out var title) == false)
                {
                    continue;
                }

                result.LearningLanguages.Add(new UserLearningLanguageResponse
                {
                    Code = lang.Code,
                    Title = title,
                    IsActive = lang.IsActive
                });
            }

            return result;
        }

        public void UpdateMyLanguages(int userId, UpdateUserLanguagesRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            SupportedLanguages.ValidateNative(request.NativeLanguageCode, "NativeLanguageCode");
            SupportedLanguages.ValidateLearnable(request.TargetLanguageCode, "TargetLanguageCode");

            var native = SupportedLanguages.Normalize(request.NativeLanguageCode);
            var target = SupportedLanguages.Normalize(request.TargetLanguageCode);

            if (native == target)
            {
                throw new ArgumentException("NativeLanguageCode and TargetLanguageCode must be different");
            }

            var user = _dbContext.Users.FirstOrDefault(x => x.Id == userId);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            user.NativeLanguageCode = native;
            user.TargetLanguageCode = target;

            _dbContext.SaveChanges();

            EnsureActiveCourseForTargetLanguage(userId, target);
        }

        public void UpdateMyTargetLanguage(int userId, UpdateTargetLanguageRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            SupportedLanguages.ValidateLearnable(request.TargetLanguageCode, "TargetLanguageCode");

            var target = SupportedLanguages.Normalize(request.TargetLanguageCode);

            var user = _dbContext.Users.FirstOrDefault(x => x.Id == userId);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            if (string.IsNullOrWhiteSpace(user.NativeLanguageCode))
            {
                user.NativeLanguageCode = SupportedLanguages.DefaultNativeLanguageCode;
            }

            user.TargetLanguageCode = target;

            _dbContext.SaveChanges();

            EnsureActiveCourseForTargetLanguage(userId, target);
        }


        public RemoveMyLanguageResult RemoveMyLanguage(int userId, string languageCode)
        {
            SupportedLanguages.ValidateLearnable(languageCode, "LanguageCode");

            var code = SupportedLanguages.Normalize(languageCode);
            var user = _dbContext.Users.FirstOrDefault(x => x.Id == userId);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            var courseIds = _dbContext.Courses
                .Select(x => new { x.Id, x.LanguageCode })
                .AsEnumerable()
                .Where(x => SupportedLanguages.Normalize(x.LanguageCode) == code)
                .Select(x => x.Id)
                .ToList();

            var userCourses = _dbContext.UserCourses
                .Where(x => x.UserId == userId && courseIds.Contains(x.CourseId))
                .ToList();

            var currentLanguagesCount = _dbContext.UserCourses
                .Where(x => x.UserId == userId)
                .Join(_dbContext.Courses,
                    uc => uc.CourseId,
                    c => c.Id,
                    (uc, c) => c.LanguageCode)
                .AsEnumerable()
                .Select(x => SupportedLanguages.Normalize(x))
                .Distinct()
                .Count();

            if (currentLanguagesCount <= 1)
            {
                return new RemoveMyLanguageResult
                {
                    IsSuccess = false,
                    ErrorMessage = "Не можна видалити останню мову навчання."
                };
            }

            if (userCourses.Count > 0)
            {
                _dbContext.UserCourses.RemoveRange(userCourses);
            }

            var remainingLanguages = _dbContext.UserCourses
                .Where(x => x.UserId == userId && courseIds.Contains(x.CourseId) == false)
                .Join(_dbContext.Courses,
                    uc => uc.CourseId,
                    c => c.Id,
                    (uc, c) => new { UserCourse = uc, c.LanguageCode })
                .AsEnumerable()
                .Select(x => new
                {
                    Code = SupportedLanguages.Normalize(x.LanguageCode),
                    x.UserCourse.IsActive
                })
                .GroupBy(x => x.Code)
                .Select(x => new
                {
                    Code = x.Key,
                    IsActive = x.Any(z => z.IsActive)
                })
                .OrderByDescending(x => x.IsActive)
                .ThenBy(x => x.Code)
                .ToList();

            if (string.Equals(user.TargetLanguageCode, code, StringComparison.OrdinalIgnoreCase))
            {
                user.TargetLanguageCode = remainingLanguages
                    .Select(x => x.Code)
                    .FirstOrDefault();
            }

            foreach (var activeCourse in _dbContext.UserCourses.Where(x => x.UserId == userId))
            {
                activeCourse.IsActive = false;
            }

            if (string.IsNullOrWhiteSpace(user.TargetLanguageCode) == false)
            {
                var nextActiveCourseId = _dbContext.Courses
                    .Select(x => new { x.Id, x.Title, x.LanguageCode })
                    .AsEnumerable()
                    .Where(x => SupportedLanguages.Normalize(x.LanguageCode) == user.TargetLanguageCode)
                    .OrderByDescending(x => x.Title.Contains("A1"))
                    .ThenBy(x => x.Id)
                    .Select(x => x.Id)
                    .FirstOrDefault();

                var nextActiveCourse = _dbContext.UserCourses
                    .FirstOrDefault(x => x.UserId == userId && x.CourseId == nextActiveCourseId);

                if (nextActiveCourse != null)
                {
                    nextActiveCourse.IsActive = true;
                    nextActiveCourse.LastOpenedAt = DateTime.UtcNow;
                }
            }

            _dbContext.SaveChanges();

            return new RemoveMyLanguageResult
            {
                IsSuccess = true
            };
        }

        public LanguageAvailabilityResponse GetLanguageAvailability(string languageCode)
        {
            SupportedLanguages.ValidateLearnable(languageCode, "LanguageCode");

            var normalized = SupportedLanguages.Normalize(languageCode);

            var hasCourses = _dbContext.Courses
                .Any(x => x.IsPublished && x.LanguageCode == normalized);

            return new LanguageAvailabilityResponse
            {
                LanguageCode = normalized,
                HasPublishedCourses = hasCourses
            };
        }


        private void EnsureActiveCourseForTargetLanguage(int userId, string targetLanguageCode)
        {
            var course = _dbContext.Courses
                .Where(x => x.IsPublished && x.LanguageCode == targetLanguageCode)
                .OrderByDescending(x => x.Title.Contains("A1"))
                .ThenBy(x => x.Id)
                .FirstOrDefault();

            if (course == null)
            {
                return;
            }

            var myCourses = _dbContext.UserCourses.Where(x => x.UserId == userId).ToList();

            foreach (var c in myCourses)
            {
                c.IsActive = false;
            }

            var existing = myCourses.FirstOrDefault(x => x.CourseId == course.Id);

            if (existing == null)
            {
                _dbContext.UserCourses.Add(new UserCourse
                {
                    UserId = userId,
                    CourseId = course.Id,
                    IsActive = true,
                    IsCompleted = false,
                    StartedAt = DateTime.UtcNow,
                    LastOpenedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.IsActive = true;
                existing.LastOpenedAt = DateTime.UtcNow;
            }

            _dbContext.SaveChanges();
        }
    }
}
