using System.Collections.Generic;

namespace Lumino.Api.Utils
{
    public class DemoSettings
    {
        public List<int> LessonIds { get; set; } = new List<int>();

        // Optional map: languageCode -> list of demo lesson ids.
        // If languageCode is not present - fallback to LessonIds.
        public Dictionary<string, List<int>> LanguageLessonIds { get; set; } = new Dictionary<string, List<int>>();
    }
}
