using Lumino.Api.Application.DTOs;
using Lumino.Api.Utils;

namespace Lumino.Api.Application.Validators
{
    public class LoginRequestValidator : ILoginRequestValidator
    {
        public void Validate(LoginRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var login = !string.IsNullOrWhiteSpace(request.Login)
                ? request.Login
                : request.Email;

            if (string.IsNullOrWhiteSpace(login))
            {
                throw new ArgumentException("Login is required");
            }

            var value = login.Trim();

            if (value.Contains('@'))
            {
                AccountValidationRules.ValidateEmail(value);
            }
            else
            {
                AccountValidationRules.ValidateLoginUsername(value);
            }

            AccountValidationRules.ValidatePasswordForLogin(request.Password);
        }
    }
}
