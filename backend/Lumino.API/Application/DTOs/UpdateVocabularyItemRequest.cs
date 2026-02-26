namespace Lumino.Api.Application.DTOs
{
    public class UpdateVocabularyItemRequest
    {
        public string Word { get; set; } = null!;

        public List<string> Translations { get; set; } = new();

        public string? Example { get; set; }
    }
}
