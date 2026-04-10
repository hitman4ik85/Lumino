namespace Lumino.Api.Application.DTOs
{
    public class AdminVocabularyExportResponse
    {
        public DateTime ExportedAt { get; set; } = DateTime.UtcNow;

        public List<AdminVocabularyItemResponse> Items { get; set; } = new();
    }
}
