using Lumino.Api.Application.DTOs;
using Lumino.Api.Utils;

namespace Lumino.Api.Application.Validators
{
    public class DeleteAccountRequestValidator : IDeleteAccountRequestValidator
    {
        public void Validate(DeleteAccountRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                AccountValidationRules.ValidatePasswordForLogin(request.Password, fieldName: "Password");
            }
        }
    }
}
