namespace Lumino.Api.Application.DTOs
{
    public class AdminVocabularyItemResponse
    {
        public int Id { get; set; }

        public string Word { get; set; } = null!;

        public string? Example { get; set; }

        public List<string> Translations { get; set; } = new();
    }
}
