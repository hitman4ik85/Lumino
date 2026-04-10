using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lumino.Api.Controllers
{
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "Admin")]
    public class AdminUsersController : ControllerBase
    {
        private readonly IAdminUserService _adminUserService;

        public AdminUsersController(IAdminUserService adminUserService)
        {
            _adminUserService = adminUserService;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(_adminUserService.GetAll());
        }

        [HttpPost]
        public IActionResult Create([FromBody] AdminUserUpsertRequest request)
        {
            var currentAdminUserId = ClaimsUtils.GetUserIdOrThrow(User);
            var result = _adminUserService.Create(request, currentAdminUserId);
            return Ok(result);
        }

        [HttpPut("{id:int}")]
        public IActionResult Update(int id, [FromBody] AdminUserUpsertRequest request)
        {
            var currentAdminUserId = ClaimsUtils.GetUserIdOrThrow(User);
            var result = _adminUserService.Update(id, request, currentAdminUserId);
            return Ok(result);
        }

        [HttpDelete("{id:int}")]
        public IActionResult Delete(int id)
        {
            var currentAdminUserId = ClaimsUtils.GetUserIdOrThrow(User);

            _adminUserService.Delete(id, currentAdminUserId);

            return NoContent();
        }
    }
}
