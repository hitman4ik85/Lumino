using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Validators;
using Xunit;

namespace Lumino.Tests;

public class DeleteAccountRequestValidatorTests
{
    [Fact]
    public void Validate_WhenRequestIsNull_ShouldThrow()
    {
        var validator = new DeleteAccountRequestValidator();

        Assert.Throws<ArgumentException>(() => validator.Validate(null!));
    }

    [Fact]
    public void Validate_WhenPasswordIsEmpty_ShouldNotThrow()
    {
        var validator = new DeleteAccountRequestValidator();
        var request = new DeleteAccountRequest
        {
            Password = string.Empty
        };

        var action = () => validator.Validate(request);

        action();
    }

    [Fact]
    public void Validate_WhenPasswordIsLongerThan64_ShouldThrow()
    {
        var validator = new DeleteAccountRequestValidator();
        var request = new DeleteAccountRequest
        {
            Password = new string('1', 65)
        };

        Assert.Throws<ArgumentException>(() => validator.Validate(request));
    }
}
