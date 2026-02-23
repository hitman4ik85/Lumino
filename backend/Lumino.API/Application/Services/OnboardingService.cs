using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Utils;
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
    }
}
