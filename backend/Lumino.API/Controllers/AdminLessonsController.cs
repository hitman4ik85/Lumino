using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lumino.Api.Controllers
{
    [ApiController]
    [Route("api/admin/lessons")]
    [Authorize(Roles = "Admin")]
    public class AdminLessonsController : ControllerBase
    {
        private readonly IAdminLessonService _adminLessonService;

        public AdminLessonsController(IAdminLessonService adminLessonService)
        {
            _adminLessonService = adminLessonService;
        }

        [HttpGet("topic/{topicId}")]
        public IActionResult GetByTopic(int topicId)
        {
            return Ok(_adminLessonService.GetByTopic(topicId));
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            return Ok(_adminLessonService.GetById(id));
        }

        [HttpPost("{id}/copy")]
        public IActionResult Copy(int id, CopyItemRequest? request)
        {
            return Ok(_adminLessonService.Copy(id, request));
        }

        [HttpGet("{lessonId}/exercises/export")]
        public IActionResult ExportExercises(int lessonId)
        {
            return Ok(_adminLessonService.ExportExercises(lessonId));
        }

        [HttpPost("{lessonId}/exercises/import")]
        public IActionResult ImportExercises(int lessonId, ImportExercisesRequest request)
        {
            return Ok(_adminLessonService.ImportExercises(lessonId, request));
        }

        [HttpPost]
        public IActionResult Create(CreateLessonRequest request)
        {
            var result = _adminLessonService.Create(request);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, UpdateLessonRequest request)
        {
            _adminLessonService.Update(id, request);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            _adminLessonService.Delete(id);
            return NoContent();
        }
    }
}
