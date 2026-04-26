using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Application.Validators;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;

namespace Lumino.Api.Application.Services
{
    public class UserService : IUserService
    {
        private readonly LuminoDbContext _dbContext;
        private readonly IUpdateProfileRequestValidator _updateProfileRequestValidator;
        private readonly LearningSettings _learningSettings;
        private readonly IDateTimeProvider _dateTimeProvider;

        public UserService(LuminoDbContext dbContext, IUpdateProfileRequestValidator updateProfileRequestValidator, IOptions<LearningSettings> learningSettings, IDateTimeProvider dateTimeProvider)
        {
            _dbContext = dbContext;
            _updateProfileRequestValidator = updateProfileRequestValidator;
            _learningSettings = learningSettings.Value;
            _dateTimeProvider = dateTimeProvider;
        }

        public UserProfileResponse GetCurrentUser(int userId)
        {
            var user = _dbContext.Users.FirstOrDefault(x => x.Id == userId);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            EnsureTodayCalendarActivity(userId);

            var hasGoogleExternalLogin = _dbContext.UserExternalLogins.Any(x => x.UserId == userId && x.Provider == "google");
            var hasPassword = !hasGoogleExternalLogin && !string.IsNullOrWhiteSpace(user.PasswordHash);
            var (currentStreak, bestStreak) = GetStreakValues(userId);
            return new UserProfileResponse
            {
                Id = user.Id,
                Username = user.Username,
                AvatarUrl = user.AvatarUrl,
                Email = user.Email,
                IsEmailVerified = user.IsEmailVerified,
                Role = user.Role.ToString(),
                CreatedAt = user.CreatedAt,
                NativeLanguageCode = user.NativeLanguageCode,
                TargetLanguageCode = user.TargetLanguageCode,
                Hearts = user.Hearts,
                Crystals = user.Crystals,
                HeartsMax = HeartsEconomyCalculator.GetHeartsMax(_learningSettings),
                HeartRegenMinutes = HeartsEconomyCalculator.GetHeartRegenMinutes(_learningSettings),
                CrystalCostPerHeart = HeartsEconomyCalculator.GetCrystalCostPerHeart(_learningSettings),
                NextHeartAtUtc = HeartsEconomyCalculator.GetNextHeartAtUtc(user.Hearts, user.HeartsUpdatedAtUtc, _learningSettings),
                NextHeartInSeconds = HeartsEconomyCalculator.GetNextHeartInSeconds(user.Hearts, user.HeartsUpdatedAtUtc, _learningSettings),
                Theme = string.IsNullOrWhiteSpace(user.Theme) ? "light" : user.Theme,
                HasPassword = hasPassword,
                IsGoogleAccount = hasGoogleExternalLogin,
                CurrentStreakDays = currentStreak,
                BestStreakDays = bestStreak
            };
        }

        public UserProfileResponse UpdateProfile(int userId, UpdateProfileRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var user = _dbContext.Users.FirstOrDefault(x => x.Id == userId);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            var requestedAvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();
            var currentAvatarUrl = string.IsNullOrWhiteSpace(user.AvatarUrl) ? null : user.AvatarUrl.Trim();

            var requestForValidation = new UpdateProfileRequest
            {
                Username = request.Username,
                AvatarUrl = string.Equals(requestedAvatarUrl, currentAvatarUrl, StringComparison.Ordinal) ? null : request.AvatarUrl,
                Theme = request.Theme
            };

            _updateProfileRequestValidator.Validate(requestForValidation);

            if (!string.IsNullOrWhiteSpace(request.Username))
            {
                var username = request.Username.Trim();

                var exists = _dbContext.Users.Any(x => x.Username == username && x.Id != userId);

                if (exists)
                {
                    throw new ConflictException("Користувач з таким username уже існує.");
                }

                user.Username = username;
            }

            if (!string.IsNullOrWhiteSpace(request.AvatarUrl))
            {
                user.AvatarUrl = request.AvatarUrl.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.Theme))
            {
                user.Theme = request.Theme.Trim().ToLowerInvariant();
            }

            _dbContext.SaveChanges();

            return GetCurrentUser(userId);
        }

        private void EnsureTodayCalendarActivity(int userId)
        {
            var todayKyiv = KyivDateTimeHelper.GetKyivDate(_dateTimeProvider.UtcNow);

            var hasTodayActivity = _dbContext.UserDailyActivities.Any(x => x.UserId == userId && x.DateUtc == todayKyiv);

            if (hasTodayActivity)
            {
                return;
            }

            _dbContext.UserDailyActivities.Add(new UserDailyActivity
            {
                UserId = userId,
                DateUtc = todayKyiv
            });

            _dbContext.SaveChanges();
        }

        private (int current, int best) GetStreakValues(int userId)
        {
            var todayKyiv = KyivDateTimeHelper.GetKyivDate(_dateTimeProvider.UtcNow);

            var streak = _dbContext.UserStreaks.FirstOrDefault(x => x.UserId == userId);

            if (streak == null)
            {
                return (0, 0);
            }

            var lastDate = streak.LastActivityDateUtc.Date;

            if (lastDate < todayKyiv.AddDays(-1) && streak.CurrentStreak != 0)
            {
                streak.CurrentStreak = 0;
                _dbContext.SaveChanges();
            }

            return (streak.CurrentStreak, streak.BestStreak);
        }

    }
}
