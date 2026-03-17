using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lumino.Api.Controllers
{
    [ApiController]
    [Route("api/onboarding")]
    public class OnboardingController : ControllerBase
    {
        private readonly IOnboardingService _onboardingService;

        public OnboardingController(IOnboardingService onboardingService)
        {
            _onboardingService = onboardingService;
        }

        [HttpGet("languages")]
        [AllowAnonymous]
        public IActionResult GetSupportedLanguages()
        {
            var result = _onboardingService.GetSupportedLanguages();
            return Ok(result);
        }

        [HttpGet("languages/me")]
        [Authorize]
        public IActionResult GetMyLanguages()
        {
            var userId = ClaimsUtils.GetUserIdOrThrow(User);
            return Ok(_onboardingService.GetMyLanguages(userId));
        }

        [HttpPut("languages/me")]
        [Authorize]
        public IActionResult UpdateMyLanguages([FromBody] UpdateUserLanguagesRequest request)
        {
            var userId = ClaimsUtils.GetUserIdOrThrow(User);
            _onboardingService.UpdateMyLanguages(userId, request);
            return NoContent();
        }

        [HttpPut("target-language/me")]
        [Authorize]
        public IActionResult UpdateMyTargetLanguage([FromBody] UpdateTargetLanguageRequest request)
        {
            var userId = ClaimsUtils.GetUserIdOrThrow(User);
            _onboardingService.UpdateMyTargetLanguage(userId, request);
            return NoContent();
        }

        [HttpDelete("languages/me/{languageCode}")]
        [Authorize]
        public IActionResult RemoveMyLanguage(string languageCode)
        {
            var userId = ClaimsUtils.GetUserIdOrThrow(User);
            var result = _onboardingService.RemoveMyLanguage(userId, languageCode);

            if (result.IsSuccess == false)
            {
                return new ObjectResult(new
                {
                    type = "bad_request",
                    title = "Bad Request",
                    status = 400,
                    detail = result.ErrorMessage,
                    instance = HttpContext.Request.Path.Value ?? "",
                    traceId = HttpContext.TraceIdentifier
                })
                {
                    StatusCode = 400,
                    ContentTypes = { "application/problem+json" }
                };
            }

            return NoContent();
        }

        [HttpGet("languages/{languageCode}/availability")]
        [AllowAnonymous]
        public IActionResult GetLanguageAvailability(string languageCode)
        {
            var result = _onboardingService.GetLanguageAvailability(languageCode);
            return Ok(result);
        }
    }
}
