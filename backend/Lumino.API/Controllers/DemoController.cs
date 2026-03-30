using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Lumino.Api.Controllers
{
    [ApiController]
    [Route("api/demo")]
    [AllowAnonymous]
    public class DemoController : ControllerBase
    {
        private readonly IDemoLessonService _demoLessonService;
        private readonly ILogger<DemoController> _logger;
        private readonly IWebHostEnvironment _environment;

        public DemoController(IDemoLessonService demoLessonService, ILogger<DemoController> logger, IWebHostEnvironment environment)
        {
            _demoLessonService = demoLessonService;
            _logger = logger;
            _environment = environment;
        }

        [HttpGet("lessons")]
        public IActionResult GetDemoLessons([FromQuery] string? languageCode, [FromQuery] string? level = null)
        {
            var result = _demoLessonService.GetDemoLessons(languageCode, level);
            return Ok(result);
        }

        [HttpGet("next")]
        public IActionResult GetDemoNext([FromQuery] int step = 0, [FromQuery] string? languageCode = null, [FromQuery] string? level = null)
        {
            var result = _demoLessonService.GetDemoNextLesson(step, languageCode, level);

            if (result.Step == 0)
            {
                _logger.LogInformation("demo_started step={step} total={total}", result.Step, result.Total);
            }
            else
            {
                _logger.LogInformation("demo_next_requested step={step} total={total}", result.Step, result.Total);
            }

            return Ok(result);
        }

        [HttpGet("next-pack")]
        public IActionResult GetDemoNextPack([FromQuery] int step = 0, [FromQuery] string? languageCode = null, [FromQuery] string? level = null)
        {
            var result = _demoLessonService.GetDemoNextLessonPack(step, languageCode, level);
            var baseUrl = $"{Request.Scheme}://{Request.Host}";

            foreach (var item in result.Exercises)
            {
                item.ImageUrl = MediaUrlResolver.ResolveLessonImageForClient(_environment, baseUrl, item.ImageUrl);
            }

            if (result.Step == 0)
            {
                _logger.LogInformation("demo_started step={step} total={total}", result.Step, result.Total);
            }
            else
            {
                _logger.LogInformation("demo_next_pack_requested step={step} total={total}", result.Step, result.Total);
            }

            return Ok(result);
        }

        [HttpGet("lessons/{lessonId}")]
        public IActionResult GetDemoLessonById(int lessonId, [FromQuery] string? languageCode = null, [FromQuery] string? level = null)
        {
            var result = _demoLessonService.GetDemoLessonById(lessonId, languageCode, level);
            return Ok(result);
        }

        [HttpGet("lessons/{lessonId}/exercises")]
        public IActionResult GetDemoExercisesByLesson(int lessonId, [FromQuery] string? languageCode = null, [FromQuery] string? level = null)
        {
            var result = _demoLessonService.GetDemoExercisesByLesson(lessonId, languageCode, level);
            var baseUrl = $"{Request.Scheme}://{Request.Host}";

            foreach (var item in result)
            {
                item.ImageUrl = MediaUrlResolver.ResolveLessonImageForClient(_environment, baseUrl, item.ImageUrl);
            }

            return Ok(result);
        }

        [HttpPost("lesson-submit")]
        public IActionResult SubmitDemoLesson([FromBody] SubmitLessonRequest request, [FromQuery] string? languageCode = null, [FromQuery] string? level = null)
        {
            var result = _demoLessonService.SubmitDemoLesson(request, languageCode, level);

            _logger.LogInformation(
                "demo_lesson_submitted lessonId={lessonId} isPassed={isPassed} correct={correct} total={total}",
                request.LessonId,
                result.IsPassed,
                result.CorrectAnswers,
                result.TotalExercises
            );

            if (result.IsPassed)
            {
                _logger.LogInformation("demo_lesson_passed lessonId={lessonId}", request.LessonId);
            }

            return Ok(result);
        }
    }
}
