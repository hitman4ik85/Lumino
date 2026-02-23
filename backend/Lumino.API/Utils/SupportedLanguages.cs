using System.Collections.Generic;
using System.Linq;

namespace Lumino.Api.Utils
{
    public static class SupportedLanguages
    {
        // Ukrainian is considered the default native language for the application.
        // It must NOT be available as a language to learn.
        public const string DefaultNativeLanguageCode = "uk";

        private static readonly List<LanguageOption> _all = new()
        {
            new LanguageOption { Code = "uk", Title = "Ukrainian" },
            new LanguageOption { Code = "en", Title = "English" },
            new LanguageOption { Code = "fr", Title = "French" },
            new LanguageOption { Code = "pl", Title = "Polish" },
            new LanguageOption { Code = "de", Title = "German" },
            new LanguageOption { Code = "es", Title = "Spanish" },
            new LanguageOption { Code = "it", Title = "Italian" },
            new LanguageOption { Code = "zh", Title = "Chinese" },
            new LanguageOption { Code = "ja", Title = "Japanese" },
            new LanguageOption { Code = "ko", Title = "Korean" }
        };

        private static readonly List<LanguageOption> _learnable = _all
            .Where(x => x.Code != DefaultNativeLanguageCode)
            .ToList();

        private static readonly HashSet<string> _allCodes = _all
            .Select(x => x.Code)
            .ToHashSet(System.StringComparer.OrdinalIgnoreCase);

        private static readonly HashSet<string> _learnableCodes = _learnable
            .Select(x => x.Code)
            .ToHashSet(System.StringComparer.OrdinalIgnoreCase);

        public static IReadOnlyList<LanguageOption> All => _all;

        public static IReadOnlyList<LanguageOption> Learnable => _learnable;

        public static string Normalize(string? code)
        {
            return (code ?? string.Empty).Trim().ToLowerInvariant();
        }

        public static bool IsSupported(string? code)
        {
            var normalized = Normalize(code);
            return !string.IsNullOrWhiteSpace(normalized) && _allCodes.Contains(normalized);
        }

        public static bool IsLearnable(string? code)
        {
            var normalized = Normalize(code);
            return !string.IsNullOrWhiteSpace(normalized) && _learnableCodes.Contains(normalized);
        }

        // Backward-compatible: Validate(...) keeps validating against all supported languages.
        public static void Validate(string? code, string fieldName)
        {
            ValidateNative(code, fieldName);
        }

        public static void ValidateNative(string? code, string fieldName)
        {
            var normalized = Normalize(code);

            if (string.IsNullOrWhiteSpace(normalized))
            {
                throw new System.ArgumentException($"{fieldName} is required");
            }

            if (!_allCodes.Contains(normalized))
            {
                throw new System.ArgumentException($"{fieldName} is not supported");
            }
        }

        public static void ValidateLearnable(string? code, string fieldName)
        {
            var normalized = Normalize(code);

            if (string.IsNullOrWhiteSpace(normalized))
            {
                throw new System.ArgumentException($"{fieldName} is required");
            }

            if (!_learnableCodes.Contains(normalized))
            {
                throw new System.ArgumentException($"{fieldName} is not supported");
            }
        }

        public class LanguageOption
        {
            public string Code { get; set; } = null!;
            public string Title { get; set; } = null!;
        }
    }
}
