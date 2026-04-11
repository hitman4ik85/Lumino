using System.Text.Json;
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
        public IActionResult Update(int id, [FromBody] JsonElement requestBody)
        {
            var currentAdminUserId = ClaimsUtils.GetUserIdOrThrow(User);
            var request = requestBody.Deserialize<AdminUserUpsertRequest>(new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            }) ?? new AdminUserUpsertRequest();

            request.ProvidedFields = requestBody.ValueKind == JsonValueKind.Object
                ? requestBody.EnumerateObject().Select(x => x.Name).ToHashSet(StringComparer.OrdinalIgnoreCase)
                : new HashSet<string>(StringComparer.OrdinalIgnoreCase);

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
