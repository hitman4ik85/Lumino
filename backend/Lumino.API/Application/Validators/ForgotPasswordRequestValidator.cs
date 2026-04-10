using Lumino.Api.Application.DTOs;
using Lumino.Api.Utils;

namespace Lumino.Api.Application.Validators
{
    public class ForgotPasswordRequestValidator : IForgotPasswordRequestValidator
    {
        public void Validate(ForgotPasswordRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            AccountValidationRules.ValidateEmail(request.Email);
        }
    }
}
