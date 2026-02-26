using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lumino.Api.Controllers
{
    [ApiController]
    [Route("api/admin/exercises")]
    [Authorize(Roles = "Admin")]
    public class AdminExercisesController : ControllerBase
    {
        private readonly IAdminExerciseService _adminExerciseService;

        public AdminExercisesController(IAdminExerciseService adminExerciseService)
        {
            _adminExerciseService = adminExerciseService;
        }

        [HttpGet("lesson/{lessonId}")]
        public IActionResult GetByLesson(int lessonId)
        {
            return Ok(_adminExerciseService.GetByLesson(lessonId));
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            return Ok(_adminExerciseService.GetById(id));
        }

        [HttpPost("{id}/copy")]
        public IActionResult Copy(int id, CopyItemRequest? request)
        {
            return Ok(_adminExerciseService.Copy(id, request));
        }

        [HttpPost]
        public IActionResult Create(CreateExerciseRequest request)
        {
            var result = _adminExerciseService.Create(request);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, UpdateExerciseRequest request)
        {
            _adminExerciseService.Update(id, request);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            _adminExerciseService.Delete(id);
            return NoContent();
        }
    }
}
