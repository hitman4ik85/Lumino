using System.Collections.Generic;

namespace Lumino.Api.Utils
{
    public class LearningSettings
    {
        public int PassingScorePercent { get; set; } = 80;

        // щоденна ціль (як у Duolingo): скільки "очок" (правильних відповідей) треба набрати за день.
        public int DailyGoalScoreTarget { get; set; } = 100;

        public int SceneCompletionScore { get; set; } = 15;

        // Скільки балів у TotalScore / daily goal дає 1 правильна вправа уроку.
        public int LessonCorrectAnswerScore { get; set; } = 5;

        // поріг проходження сцени у відсотках (як у Duolingo). 100 = без помилок.
        public int ScenePassingPercent { get; set; } = 100;

        // скільки пройдених уроків потрібно на відкриття кожної наступної сцени.
        // правило: requiredLessons = (sceneId - 1) * SceneUnlockEveryLessons
        public int SceneUnlockEveryLessons { get; set; } = 1;

        // SRS (Vocabulary): через скільки годин повторюємо слово після помилки.
        public int VocabularyWrongDelayHours { get; set; } = 12;

        // SRS (Vocabulary): якщо користувач натиснув "Пропуск/Не впевнений".
        // Робимо коротке відкладення, не скидаючи прогрес повністю.
        public int VocabularySkipDelayMinutes { get; set; } = 10;

        // SRS (Vocabulary): інтервали повторення в днях для правильних відповідей.
        // приклад: 1, 2, 4, 7, 14, 30, 60...
        public List<int> VocabularyReviewIntervalsDays { get; set; } = new List<int> { 1, 2, 4, 7, 14, 30, 60 };

        // Hearts / Crystals (Duolingo-like economy)
        public int HeartsMax { get; set; } = 5;

        // Скільки "сердечок" знімаємо за 1 помилку. 1 = класичний варіант.
        public int HeartsCostPerMistake { get; set; } = 1;

        // Скільки кристалів коштує відновити 1 сердечко.
        public int CrystalCostPerHeart { get; set; } = 20;

        // Автовідновлення: через скільки хвилин відновлюється 1 сердечко.
        public int HeartRegenMinutes { get; set; } = 30;

        // Нагорода кристалами за урок рахується так само, як бали за правильні вправи.
        // Значення лишаємо для backward-compatible конфігів, але для уроку використовується розрахунок від correct answers.
        public int CrystalsRewardPerPassedLesson { get; set; } = 5;

        // Нагорода кристалами за перше проходження сцени (completed).
        public int CrystalsRewardPerCompletedScene { get; set; } = 15;
    }
}
