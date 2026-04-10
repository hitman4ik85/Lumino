using Lumino.Api.Application.DTOs;
using Lumino.Api.Utils;
using Microsoft.Extensions.Configuration;

namespace Lumino.Api.Application.Validators
{
    public class RegisterRequestValidator : IRegisterRequestValidator
    {
        private readonly IConfiguration _configuration;

        public RegisterRequestValidator(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public void Validate(RegisterRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            AccountValidationRules.ValidateUsername(request.Username, required: false);
            AccountValidationRules.ValidateEmail(request.Email);
            AccountValidationRules.ValidatePasswordForSet(request.Password);

            SupportedAvatars.Validate(request.AvatarUrl, "AvatarUrl", _configuration);

            var hasNative = !string.IsNullOrWhiteSpace(request.NativeLanguageCode);
            var hasTarget = !string.IsNullOrWhiteSpace(request.TargetLanguageCode);

            if (hasNative && !hasTarget)
            {
                throw new ArgumentException("TargetLanguageCode is required when NativeLanguageCode is provided");
            }

            // TargetLanguageCode can be provided without NativeLanguageCode.
            // In that case the application will use the default native language.
            if (hasTarget)
            {
                SupportedLanguages.ValidateLearnable(request.TargetLanguageCode, "TargetLanguageCode");

                if (hasNative)
                {
                    SupportedLanguages.ValidateNative(request.NativeLanguageCode, "NativeLanguageCode");

                    var native = SupportedLanguages.Normalize(request.NativeLanguageCode);
                    var target = SupportedLanguages.Normalize(request.TargetLanguageCode);

                    if (native == target)
                    {
                        throw new ArgumentException("NativeLanguageCode and TargetLanguageCode must be different");
                    }
                }
            }
        }
    }
}
