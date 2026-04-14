using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Application.Validators;
using Lumino.Api.Data;
using Lumino.Api.Utils;

namespace Lumino.Api.Application.Services
{
    public class UserAccountService : IUserAccountService
    {
        private readonly LuminoDbContext _dbContext;
        private readonly IChangePasswordRequestValidator _changePasswordRequestValidator;
        private readonly IDeleteAccountRequestValidator _deleteAccountRequestValidator;
        private readonly IPasswordHasher _passwordHasher;

        public UserAccountService(
            LuminoDbContext dbContext,
            IChangePasswordRequestValidator changePasswordRequestValidator,
            IDeleteAccountRequestValidator deleteAccountRequestValidator,
            IPasswordHasher passwordHasher)
        {
            _dbContext = dbContext;
            _changePasswordRequestValidator = changePasswordRequestValidator;
            _deleteAccountRequestValidator = deleteAccountRequestValidator;
            _passwordHasher = passwordHasher;
        }

        public void ChangePassword(int userId, ChangePasswordRequest request)
        {
            _changePasswordRequestValidator.Validate(request);

            var user = _dbContext.Users.FirstOrDefault(x => x.Id == userId);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            var ok = _passwordHasher.Verify(request.OldPassword, user.PasswordHash);

            if (!ok)
            {
                throw new UnauthorizedAccessException("Invalid credentials");
            }

            user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
            InvalidateUserSessions(user);
        }

        public void DeleteAccount(int userId, DeleteAccountRequest request)
        {
            _deleteAccountRequestValidator.Validate(request);

            var user = _dbContext.Users.FirstOrDefault(x => x.Id == userId);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            var hasGoogleExternalLogin = _dbContext.UserExternalLogins.Any(x => x.UserId == userId && x.Provider == "google");
            var hasPassword = !hasGoogleExternalLogin && !string.IsNullOrWhiteSpace(user.PasswordHash);
            var hasRequestPassword = !string.IsNullOrWhiteSpace(request.Password);

            if (hasPassword)
            {
                if (!hasRequestPassword)
                {
                    throw new ArgumentException("Password is required");
                }

                var ok = _passwordHasher.Verify(request.Password, user.PasswordHash);

                if (!ok)
                {
                    throw new UnauthorizedAccessException("Invalid credentials");
                }
            }
            else if (!hasGoogleExternalLogin)
            {
                throw new UnauthorizedAccessException("Invalid credentials");
            }

            InvalidateUserSessions(user);

            DeleteUserRelations(userId);
            _dbContext.Users.Remove(user);
            _dbContext.SaveChanges();
        }

        private void DeleteUserRelations(int userId)
        {
            var emailVerificationTokens = _dbContext.EmailVerificationTokens.Where(x => x.UserId == userId).ToList();
            if (emailVerificationTokens.Count > 0)
            {
                _dbContext.EmailVerificationTokens.RemoveRange(emailVerificationTokens);
            }

            var passwordResetTokens = _dbContext.PasswordResetTokens.Where(x => x.UserId == userId).ToList();
            if (passwordResetTokens.Count > 0)
            {
                _dbContext.PasswordResetTokens.RemoveRange(passwordResetTokens);
            }

            var refreshTokens = _dbContext.RefreshTokens.Where(x => x.UserId == userId).ToList();
            if (refreshTokens.Count > 0)
            {
                _dbContext.RefreshTokens.RemoveRange(refreshTokens);
            }

            var userExternalLogins = _dbContext.UserExternalLogins.Where(x => x.UserId == userId).ToList();
            if (userExternalLogins.Count > 0)
            {
                _dbContext.UserExternalLogins.RemoveRange(userExternalLogins);
            }

            var userLessonProgresses = _dbContext.UserLessonProgresses.Where(x => x.UserId == userId).ToList();
            if (userLessonProgresses.Count > 0)
            {
                _dbContext.UserLessonProgresses.RemoveRange(userLessonProgresses);
            }

            var userCourses = _dbContext.UserCourses.Where(x => x.UserId == userId).ToList();
            if (userCourses.Count > 0)
            {
                _dbContext.UserCourses.RemoveRange(userCourses);
            }

            var lessonResults = _dbContext.LessonResults.Where(x => x.UserId == userId).ToList();
            if (lessonResults.Count > 0)
            {
                _dbContext.LessonResults.RemoveRange(lessonResults);
            }

            var sceneAttempts = _dbContext.SceneAttempts.Where(x => x.UserId == userId).ToList();
            if (sceneAttempts.Count > 0)
            {
                _dbContext.SceneAttempts.RemoveRange(sceneAttempts);
            }

            var userAchievements = _dbContext.UserAchievements.Where(x => x.UserId == userId).ToList();
            if (userAchievements.Count > 0)
            {
                _dbContext.UserAchievements.RemoveRange(userAchievements);
            }

            var userVocabularies = _dbContext.UserVocabularies.Where(x => x.UserId == userId).ToList();
            if (userVocabularies.Count > 0)
            {
                _dbContext.UserVocabularies.RemoveRange(userVocabularies);
            }

            var userProgresses = _dbContext.UserProgresses.Where(x => x.UserId == userId).ToList();
            if (userProgresses.Count > 0)
            {
                _dbContext.UserProgresses.RemoveRange(userProgresses);
            }

            var userDailyActivities = _dbContext.UserDailyActivities.Where(x => x.UserId == userId).ToList();
            if (userDailyActivities.Count > 0)
            {
                _dbContext.UserDailyActivities.RemoveRange(userDailyActivities);
            }

            var userStreaks = _dbContext.UserStreaks.Where(x => x.UserId == userId).ToList();
            if (userStreaks.Count > 0)
            {
                _dbContext.UserStreaks.RemoveRange(userStreaks);
            }
        }

        private void InvalidateUserSessions(Domain.Entities.User user)
        {
            var activeTokens = _dbContext.RefreshTokens
                .Where(x => x.UserId == user.Id && x.RevokedAt == null)
                .ToList();

            var now = DateTime.UtcNow;

            foreach (var token in activeTokens)
            {
                token.RevokedAt = now;
            }

            user.SessionVersion++;
            _dbContext.SaveChanges();
        }
    }
}
