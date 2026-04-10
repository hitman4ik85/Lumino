using Lumino.Api.Application.DTOs;
using Lumino.Api.Utils;

namespace Lumino.Api.Application.Validators
{
    public class ResetPasswordRequestValidator : IResetPasswordRequestValidator
    {
        public void Validate(ResetPasswordRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            if (string.IsNullOrWhiteSpace(request.Token))
            {
                throw new ArgumentException("Token is required");
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                throw new ArgumentException("NewPassword is required");
            }

            if (string.IsNullOrWhiteSpace(request.ConfirmPassword))
            {
                throw new ArgumentException("ConfirmPassword is required");
            }

            AccountValidationRules.ValidatePasswordForSet(request.NewPassword, fieldName: "NewPassword");

            if (request.NewPassword != request.ConfirmPassword)
            {
                throw new ArgumentException("Passwords do not match");
            }

            if (request.Token.Trim().Length < 20)
            {
                throw new ArgumentException("Token is invalid");
            }
        }
    }
}
