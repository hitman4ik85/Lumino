using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Lumino.Api.Application.Services
{
    public class RefreshTokenCleanupService : IRefreshTokenCleanupService
    {
        private readonly LuminoDbContext _dbContext;
        private readonly IConfiguration _configuration;

        public RefreshTokenCleanupService(LuminoDbContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
        }

        public List<AdminRefreshTokenResponse> GetAll()
        {
            var now = DateTime.UtcNow;

            return _dbContext.RefreshTokens
                .AsNoTracking()
                .Include(x => x.User)
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
                .Select(x => new AdminRefreshTokenResponse
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    Username = x.User.Username,
                    Email = x.User.Email,
                    Role = x.User.Role.ToString(),
                    TokenHash = x.TokenHash,
                    CreatedAt = x.CreatedAt,
                    ExpiresAt = x.ExpiresAt,
                    RevokedAt = x.RevokedAt,
                    ReplacedByTokenHash = x.ReplacedByTokenHash,
                    IsExpired = x.ExpiresAt <= now,
                    IsRevoked = x.RevokedAt != null,
                    IsActive = x.RevokedAt == null && x.ExpiresAt > now,
                })
                .ToList();
        }

        public int Cleanup(bool deleteRevokedNow = false)
        {
            var now = DateTime.UtcNow;

            var refreshSection = _configuration.GetSection("RefreshToken");

            var keepRevokedDaysText = refreshSection["KeepRevokedDays"];

            if (!int.TryParse(keepRevokedDaysText, out var keepRevokedDays))
            {
                keepRevokedDays = 30;
            }

            if (keepRevokedDays < 1)
            {
                keepRevokedDays = 1;
            }

            var keepUntil = now.AddDays(-keepRevokedDays);

            var tokensToDelete = _dbContext.RefreshTokens
                .Where(x =>
                    x.ExpiresAt <= now
                    || (x.RevokedAt != null && (deleteRevokedNow || x.RevokedAt <= keepUntil))
                )
                .ToList();

            if (tokensToDelete.Count == 0)
            {
                return 0;
            }

            _dbContext.RefreshTokens.RemoveRange(tokensToDelete);
            _dbContext.SaveChanges();

            return tokensToDelete.Count;
        }
    }
}
