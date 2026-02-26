using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lumino.Api.Controllers
{
    [ApiController]
    [Route("api/admin/vocabulary")]
    [Authorize(Roles = "Admin")]
    public class AdminVocabularyController : ControllerBase
    {
        private readonly IAdminVocabularyService _adminVocabularyService;

        public AdminVocabularyController(IAdminVocabularyService adminVocabularyService)
        {
            _adminVocabularyService = adminVocabularyService;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(_adminVocabularyService.GetAll());
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            return Ok(_adminVocabularyService.GetById(id));
        }

        [HttpPost]
        public IActionResult Create(CreateVocabularyItemRequest request)
        {
            return Ok(_adminVocabularyService.Create(request));
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, UpdateVocabularyItemRequest request)
        {
            _adminVocabularyService.Update(id, request);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            _adminVocabularyService.Delete(id);
            return NoContent();
        }

        [HttpGet("lesson/{lessonId}")]
        public IActionResult GetByLesson(int lessonId)
        {
            return Ok(_adminVocabularyService.GetByLesson(lessonId));
        }

        [HttpPost("lesson/{lessonId}/{vocabularyItemId}")]
        public IActionResult LinkToLesson(int lessonId, int vocabularyItemId)
        {
            _adminVocabularyService.LinkToLesson(lessonId, vocabularyItemId);
            return NoContent();
        }

        [HttpDelete("lesson/{lessonId}/{vocabularyItemId}")]
        public IActionResult UnlinkFromLesson(int lessonId, int vocabularyItemId)
        {
            _adminVocabularyService.UnlinkFromLesson(lessonId, vocabularyItemId);
            return NoContent();
        }
    }
}
