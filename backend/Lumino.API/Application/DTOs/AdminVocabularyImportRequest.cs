namespace Lumino.Api.Application.DTOs
{
    public class AdminVocabularyImportRequest
    {
        public int CourseId { get; set; }

        public List<CreateVocabularyItemRequest> Items { get; set; } = new();
    }
}
