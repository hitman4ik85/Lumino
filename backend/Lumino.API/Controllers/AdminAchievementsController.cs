using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lumino.Api.Controllers
{
    [ApiController]
    [Route("api/admin/achievements")]
    [Authorize(Roles = "Admin")]
    public class AdminAchievementsController : ControllerBase
    {
        private readonly IAdminAchievementService _adminAchievementService;

        public AdminAchievementsController(IAdminAchievementService adminAchievementService)
        {
            _adminAchievementService = adminAchievementService;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(_adminAchievementService.GetAll());
        }

        [HttpGet("{id:int}")]
        public IActionResult GetById(int id)
        {
            return Ok(_adminAchievementService.GetById(id));
        }

        [HttpPost]
        public IActionResult Create([FromBody] CreateAchievementRequest request)
        {
            var result = _adminAchievementService.Create(request);
            return Ok(result);
        }

        [HttpPut("{id:int}")]
        public IActionResult Update(int id, [FromBody] UpdateAchievementRequest request)
        {
            _adminAchievementService.Update(id, request);
            return Ok();
        }

        [HttpDelete("{id:int}")]
        public IActionResult Delete(int id)
        {
            _adminAchievementService.Delete(id);
            return Ok();
        }
    }
}
