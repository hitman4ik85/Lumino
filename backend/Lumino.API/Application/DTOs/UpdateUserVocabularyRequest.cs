namespace Lumino.Api.Application.DTOs
{
    public class UpdateUserVocabularyRequest
    {
        public string Word { get; set; } = null!;

        public string? Translation { get; set; }

        public List<string>? Translations { get; set; }

        public string? Example { get; set; }

        public string? PartOfSpeech { get; set; }

        public string? Definition { get; set; }

        public string? Transcription { get; set; }

        public string? Gender { get; set; }

        public List<string>? Examples { get; set; }

        public List<string>? Synonyms { get; set; }

        public List<string>? Idioms { get; set; }
    }
}
