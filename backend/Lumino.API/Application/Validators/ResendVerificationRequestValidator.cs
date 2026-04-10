using Lumino.Api.Application.DTOs;
using Lumino.Api.Utils;

namespace Lumino.Api.Application.Validators
{
    public class ResendVerificationRequestValidator : IResendVerificationRequestValidator
    {
        public void Validate(ResendVerificationRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            AccountValidationRules.ValidateEmail(request.Email);
        }
    }
}
