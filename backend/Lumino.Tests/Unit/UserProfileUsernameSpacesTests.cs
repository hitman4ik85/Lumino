using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Validators;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Lumino.Tests;

public class UserProfileUsernameSpacesTests
{
    [Fact]
    public void UpdateProfile_WithUsernameContainingSpaces_ShouldPass()
    {
        var validator = new UpdateProfileRequestValidator(new ConfigurationBuilder().Build());

        validator.Validate(new UpdateProfileRequest
        {
            Username = "Andrii Uroichenko"
        });
    }

    [Fact]
    public void Login_WithUsernameContainingSpaces_ShouldPass()
    {
        var validator = new LoginRequestValidator();

        validator.Validate(new LoginRequest
        {
            Login = "Andrii Uroichenko",
            Password = "123456"
        });
    }
}
