using Lumino.Api.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lumino.Api.Controllers
{
    [ApiController]
    [Route("api/admin/tokens")]
    [Authorize(Roles = "Admin")]
    public class AdminTokensController : ControllerBase
    {
        private readonly IRefreshTokenCleanupService _cleanupService;

        public AdminTokensController(IRefreshTokenCleanupService cleanupService)
        {
            _cleanupService = cleanupService;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(_cleanupService.GetAll());
        }

        [HttpPost("cleanup")]
        public IActionResult Cleanup()
        {
            var deleted = _cleanupService.Cleanup(deleteRevokedNow: true);
            return Ok(new { deleted });
        }
    }
}
