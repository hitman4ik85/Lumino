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

            _dbContext.Users.Remove(user);
            _dbContext.SaveChanges();
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
