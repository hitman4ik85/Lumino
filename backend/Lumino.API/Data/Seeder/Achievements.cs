using Lumino.Api.Domain.Entities;

namespace Lumino.Api.Data.Seeder
{
    public static class AchievementSeederData
    {
        public static List<Achievement> GetAchievements()
        {
            var achievements = new List<Achievement>
                        {
                            new Achievement
                            {
                                Code = "sys.first_day_learning",
                                Title = "First Study Day",
                                Description = "Complete your first study day",
                                ImageUrl = "/uploads/achievements/first-day-learning.png"
                            },
                            new Achievement
                            {
                                Code = "sys.first_lesson",
                                Title = "First Lesson",
                                Description = "Complete your first lesson",
                                ImageUrl = "/uploads/achievements/first-lesson.png"
                            },
                            new Achievement
                            {
                                Code = "sys.five_lessons",
                                Title = "5 Lessons Completed",
                                Description = "Complete 5 lessons",
                                ImageUrl = "/uploads/achievements/five-lessons.png"
                            },
                            new Achievement
                            {
                                Code = "sys.perfect_lesson",
                                Title = "Perfect Lesson",
                                Description = "Complete a lesson without mistakes"
                            },
                            new Achievement
                            {
                                Code = "sys.perfect_three_in_row",
                                Title = "No Mistakes Streak",
                                Description = "Complete 3 lessons in a row without mistakes"
                            },
                            new Achievement
                            {
                                Code = "sys.hundred_xp",
                                Title = "500 XP",
                                Description = "Earn 500 total score"
                            },
                            new Achievement
                            {
                                Code = "sys.first_scene",
                                Title = "First Scene",
                                Description = "Complete your first scene"
                            },
                            new Achievement
                            {
                                Code = "sys.first_topic_completed",
                                Title = "First Topic Completed",
                                Description = "Complete your first topic"
                            },
                            new Achievement
                            {
                                Code = "sys.five_scenes",
                                Title = "5 Scenes Completed",
                                Description = "Complete 5 scenes"
                            },
                            new Achievement
                            {
                                Code = "sys.streak_starter",
                                Title = "Streak Starter",
                                Description = "Study 3 days in a row"
                            },
                            new Achievement
                            {
                                Code = "sys.streak_7",
                                Title = "Streak 7",
                                Description = "Study 7 days in a row"
                            },
                            new Achievement
                            {
                                Code = "sys.streak_30",
                                Title = "Streak 30",
                                Description = "Study 30 days in a row"
                            },
                            new Achievement
                            {
                                Code = "sys.daily_goal",
                                Title = "Daily Goal",
                                Description = "Reach your daily goal"
                            },
                            new Achievement
                            {
                                Code = "sys.return_after_break",
                                Title = "Welcome Back",
                                Description = "Return to learning after a break"
                            }
                        };

            return achievements;
        }
    }
}
