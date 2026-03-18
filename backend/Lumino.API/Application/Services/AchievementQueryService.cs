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
                    ImageUrl = a.ImageUrl
                })
                .ToList();

            return result;
        }
    }
}
