using Lumino.Api.Application.DTOs;
using System.Collections.Generic;

namespace Lumino.Api.Application.Interfaces
{
    public interface IOnboardingService
    {
        List<LanguageOptionResponse> GetSupportedLanguages();

        void UpdateMyLanguages(int userId, UpdateUserLanguagesRequest request);

        void UpdateMyTargetLanguage(int userId, UpdateTargetLanguageRequest request);

        LanguageAvailabilityResponse GetLanguageAvailability(string languageCode);
    }
}
