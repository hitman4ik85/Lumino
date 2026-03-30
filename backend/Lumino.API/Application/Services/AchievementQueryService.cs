using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using System.Collections.Generic;

namespace Lumino.Api.Application.Services
{
    public class AchievementQueryService : IAchievementQueryService
    {
        private readonly LuminoDbContext _dbContext;

        public AchievementQueryService(LuminoDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public List<AchievementResponse> GetUserAchievements(int userId)
        {
            if (userId <= 0)
            {
                throw new ArgumentException("UserId is invalid");
            }

            var earnedByAchievementId = _dbContext.UserAchievements
                .Where(x => x.UserId == userId)
                .GroupBy(x => x.AchievementId)
                .Select(x => new
                {
                    AchievementId = x.Key,
                    EarnedAt = x.Min(v => v.EarnedAt)
                })
                .ToDictionary(x => x.AchievementId, x => x.EarnedAt);

            var result = _dbContext.Achievements
                .OrderBy(x => x.Id)
                .Select(a => new AchievementResponse
                {
                    Id = a.Id,
                    Code = a.Code,
                    Title = a.Title,
                    Description = a.Description,
                    IsEarned = earnedByAchievementId.ContainsKey(a.Id),
                    EarnedAt = earnedByAchievementId.ContainsKey(a.Id)
                        ? earnedByAchievementId[a.Id]
                        : null,
                    ImageUrl = NormalizeAchievementImageUrl(a.Code, a.ImageUrl)
                })
                .ToList();

            return result;
        }

        private static string? NormalizeAchievementImageUrl(string? code, string? imageUrl)
        {
            string? value = string.IsNullOrWhiteSpace(imageUrl)
                ? code switch
                {
                    "sys.first_day_learning" => "/uploads/achievements/first-day-learning.png",
                    "sys.first_lesson" => "/uploads/achievements/first-lesson.png",
                    "sys.five_lessons" => "/uploads/achievements/five-lessons.png",
                    _ => imageUrl
                }
                : imageUrl.Trim();

            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            value = value.Replace("\\", "/");

            if (value.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("data:", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("blob:", StringComparison.OrdinalIgnoreCase))
            {
                return value;
            }

            if (value.StartsWith("/"))
            {
                return value;
            }

            if (value.StartsWith("uploads/achievements/", StringComparison.OrdinalIgnoreCase))
            {
                return $"/{value}";
            }

            if (value.Contains("/"))
            {
                return $"/{value.TrimStart('/')}";
            }

            return $"/uploads/achievements/{value}";
        }
    }
}
