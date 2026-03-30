using Lumino.Api.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Lumino.Api.Utils;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace Lumino.Api.Controllers
{
    [ApiController]
    [Route("api/lessons/{lessonId}/exercises")]
    [Authorize]
    public class ExercisesController : ControllerBase
    {
        private readonly IExerciseService _exerciseService;
        private readonly IWebHostEnvironment _environment;

        public ExercisesController(IExerciseService exerciseService, IWebHostEnvironment environment)
        {
            _exerciseService = exerciseService;
            _environment = environment;
        }

        [HttpGet]
        public IActionResult GetExercises(int lessonId)
        {
            var userId = ClaimsUtils.GetUserIdOrThrow(User);
            var result = _exerciseService.GetExercisesByLesson(userId, lessonId);
            var baseUrl = $"{Request.Scheme}://{Request.Host}";

            foreach (var item in result)
            {
                item.ImageUrl = MediaUrlResolver.ResolveLessonImageForClient(_environment, baseUrl, item.ImageUrl);
            }

            return Ok(result);
        }
    }
}
