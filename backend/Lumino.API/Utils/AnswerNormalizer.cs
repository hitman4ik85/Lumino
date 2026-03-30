using System.Text;
using System.Text.RegularExpressions;

namespace Lumino.Api.Utils
{
    public static class AnswerNormalizer
    {
        private static readonly Regex MultiWhitespace = new Regex(@"\s+", RegexOptions.Compiled);

        public static string Normalize(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var trimmed = value.Trim();

            trimmed = NormalizeApostrophes(trimmed);
            trimmed = MultiWhitespace.Replace(trimmed, " ");

            return trimmed.ToLowerInvariant();
        }

        private static string NormalizeApostrophes(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return string.Empty;
            }

            var builder = new StringBuilder(value.Length);

            foreach (var ch in value)
            {
                if (IsApostrophe(ch))
                {
                    builder.Append('\'');
                    continue;
                }

                builder.Append(ch);
            }

            return builder.ToString();
        }

        private static bool IsApostrophe(char ch)
        {
            return ch == '\''
                || ch == '\u2019'
                || ch == '\u2018'
                || ch == '\u02BC'
                || ch == '\uFF07';
        }
    }
}
