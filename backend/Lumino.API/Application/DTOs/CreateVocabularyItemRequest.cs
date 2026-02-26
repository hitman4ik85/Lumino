namespace Lumino.Api.Application.DTOs
{
    public class CreateVocabularyItemRequest
    {
        public string Word { get; set; } = null!;

        public List<string> Translations { get; set; } = new();

        public string? Example { get; set; }
    }
}
