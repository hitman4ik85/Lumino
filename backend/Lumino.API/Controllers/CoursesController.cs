using Lumino.Api.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lumino.Api.Controllers
{
    [ApiController]
    [Route("api/courses")]
    public class CoursesController : ControllerBase
    {
        private readonly ICourseService _courseService;

        public CoursesController(ICourseService courseService)
        {
            _courseService = courseService;
        }

        [HttpGet]
        public IActionResult GetCourses([FromQuery] string? languageCode)
        {
            var result = _courseService.GetPublishedCourses(languageCode);
            return Ok(result);
        }
    }
}
