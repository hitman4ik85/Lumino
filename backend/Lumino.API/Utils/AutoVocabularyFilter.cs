using System;
using System.Collections.Generic;
using System.Linq;

namespace Lumino.Api.Utils
{
    public static class AutoVocabularyFilter
    {
        public static bool ShouldAutoAdd(string? word)
        {
            var tokens = Tokenize(word);

            return tokens.Count >= 1 && tokens.Count <= 2;
        }

        private static List<string> Tokenize(string? value)
        {
            var list = new List<string>();

            if (string.IsNullOrWhiteSpace(value))
            {
                return list;
            }

            value = value.Replace('\u2019', '\'');

            var buffer = new char[value.Length];
            int len = 0;

            foreach (var ch in value)
            {
                if (char.IsLetter(ch) || ch == '\'')
                {
                    buffer[len++] = char.ToLowerInvariant(ch);
                    continue;
                }

                if (len > 0)
                {
                    list.Add(new string(buffer, 0, len));
                    len = 0;
                }
            }

            if (len > 0)
            {
                list.Add(new string(buffer, 0, len));
            }

            return list
                .Select(x => x.Trim('\''))
                .Where(x => x.Length > 0)
                .ToList();
        }
    }
}
