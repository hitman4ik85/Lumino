namespace Lumino.Api.Application.Achievements
{
    public static class AchievementConditionTypes
    {
        public const string LessonPassCount = "LessonPassCount";
        public const string UniqueLessonPassCount = "UniqueLessonPassCount";
        public const string SceneCompletionCount = "SceneCompletionCount";
        public const string UniqueSceneCompletionCount = "UniqueSceneCompletionCount";
        public const string TopicCompletionCount = "TopicCompletionCount";
        public const string PerfectLessonCount = "PerfectLessonCount";
        public const string StudyDayStreak = "StudyDayStreak";
        public const string TotalXp = "TotalXp";

        private static readonly Dictionary<string, string> KnownTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            [LessonPassCount] = LessonPassCount,
            [UniqueLessonPassCount] = UniqueLessonPassCount,
            [SceneCompletionCount] = SceneCompletionCount,
            [UniqueSceneCompletionCount] = UniqueSceneCompletionCount,
            [TopicCompletionCount] = TopicCompletionCount,
            [PerfectLessonCount] = PerfectLessonCount,
            [StudyDayStreak] = StudyDayStreak,
            [TotalXp] = TotalXp
        };

        public static string? Normalize(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return KnownTypes.TryGetValue(value.Trim(), out var normalized)
                ? normalized
                : null;
        }

        public static bool IsSupported(string? value)
        {
            return Normalize(value) != null;
        }
    }
}
