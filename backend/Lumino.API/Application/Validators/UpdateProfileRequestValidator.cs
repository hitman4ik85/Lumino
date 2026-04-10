using Lumino.Api.Application.DTOs;
using Lumino.Api.Utils;
using Microsoft.Extensions.Configuration;

namespace Lumino.Api.Application.Validators
{
    public class UpdateProfileRequestValidator : IUpdateProfileRequestValidator
    {
        private readonly IConfiguration _configuration;

        public UpdateProfileRequestValidator(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public void Validate(UpdateProfileRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            AccountValidationRules.ValidateUsername(request.Username, required: false);

            SupportedAvatars.Validate(request.AvatarUrl, "AvatarUrl", _configuration);

            if (!string.IsNullOrWhiteSpace(request.Theme))
            {
                var value = request.Theme.Trim().ToLowerInvariant();

                if (value != "light" && value != "dark")
                {
                    throw new ArgumentException("Theme is invalid");
                }
            }
        }
    }
}
