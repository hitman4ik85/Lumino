using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Utils;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace Lumino.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public IActionResult Register(RegisterRequest request)
        {
            return Execute(() =>
            {
                var result = _authService.Register(request);
                return Ok(result);
            });
        }

        [HttpPost("login")]
        public IActionResult Login(LoginRequest request)
        {
            return Execute(() =>
            {
                var result = _authService.Login(request);
                return Ok(result);
            });
        }

        [HttpPost("forgot-password")]
        public IActionResult ForgotPassword(ForgotPasswordRequest request)
        {
            return Execute(() =>
            {
                var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = Request.Headers.UserAgent.ToString();

                var result = _authService.ForgotPassword(request, ip, userAgent);
                return Ok(result);
            });
        }

        [HttpPost("reset-password")]
        public IActionResult ResetPassword(ResetPasswordRequest request)
        {
            return Execute(() =>
            {
                _authService.ResetPassword(request);
                return NoContent();
            });
        }

        [HttpPost("verify-email")]
        public IActionResult VerifyEmail(VerifyEmailRequest request)
        {
            return Execute(() =>
            {
                var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = Request.Headers.UserAgent.ToString();

                var result = _authService.VerifyEmail(request, ip, userAgent);
                return Ok(result);
            });
        }

        [HttpPost("resend-verification")]
        public IActionResult ResendVerification(ResendVerificationRequest request)
        {
            return Execute(() =>
            {
                var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = Request.Headers.UserAgent.ToString();

                var result = _authService.ResendVerification(request, ip, userAgent);
                return Ok(result);
            });
        }

        [HttpPost("oauth/google")]
        public IActionResult OAuthGoogle(OAuthLoginRequest request)
        {
            return Execute(() =>
            {
                var result = _authService.OAuthGoogle(request);
                return Ok(result);
            });
        }

        [HttpPost("refresh")]
        public IActionResult Refresh(RefreshTokenRequest request)
        {
            return Execute(() =>
            {
                var result = _authService.Refresh(request);
                return Ok(result);
            });
        }

        [HttpPost("logout")]
        public IActionResult Logout(RefreshTokenRequest request)
        {
            return Execute(() =>
            {
                _authService.Logout(request);
                return NoContent();
            });
        }

        private IActionResult Execute(Func<IActionResult> action)
        {
            try
            {
                return action();
            }
            catch (Exception ex) when (ex is ConflictException
                                     || ex is EmailNotVerifiedException
                                     || ex is ForbiddenAccessException
                                     || ex is UnauthorizedAccessException
                                     || ex is KeyNotFoundException
                                     || ex is ArgumentException
                                     || ex is ArgumentNullException)
            {
                return BuildProblem(ex);
            }
        }

        private ObjectResult BuildProblem(Exception ex)
        {
            var (statusCode, title, type) = MapException(ex);

            return Problem(
                statusCode: statusCode,
                title: title,
                detail: ex.Message,
                type: type,
                instance: HttpContext?.Request?.Path.Value
            );
        }

        private static (int statusCode, string title, string type) MapException(Exception ex)
        {
            if (ex is ConflictException)
            {
                return ((int)HttpStatusCode.Conflict, "Conflict", "conflict");
            }

            if (ex is EmailNotVerifiedException)
            {
                return ((int)HttpStatusCode.Unauthorized, "Unauthorized", "email_not_verified");
            }

            if (ex is ForbiddenAccessException)
            {
                return ((int)HttpStatusCode.Forbidden, "Forbidden", "forbidden");
            }

            if (ex is UnauthorizedAccessException)
            {
                return ((int)HttpStatusCode.Unauthorized, "Unauthorized", "unauthorized");
            }

            if (ex is KeyNotFoundException)
            {
                return ((int)HttpStatusCode.NotFound, "Not Found", "not_found");
            }

            return ((int)HttpStatusCode.BadRequest, "Bad Request", "bad_request");
        }
    }
}
