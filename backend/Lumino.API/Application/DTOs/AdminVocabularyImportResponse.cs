namespace Lumino.Api.Application.DTOs
{
    public class AdminVocabularyImportResponse
    {
        public int CreatedCount { get; set; }

        public int UpdatedCount { get; set; }

        public int SkippedCount { get; set; }

        public List<AdminVocabularyItemResponse> Items { get; set; } = new();
    }
}
