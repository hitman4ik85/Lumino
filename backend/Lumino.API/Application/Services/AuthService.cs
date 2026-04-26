using Azure.Core;
using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Application.Validators;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;
using Lumino.Api.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Lumino.Api.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly LuminoDbContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly IEmailSender _emailSender;
        private readonly IOpenIdTokenValidator _openIdTokenValidator;
        private readonly IRegisterRequestValidator _registerRequestValidator;
        private readonly ILoginRequestValidator _loginRequestValidator;
        private readonly IForgotPasswordRequestValidator _forgotPasswordRequestValidator;
        private readonly IResetPasswordRequestValidator _resetPasswordRequestValidator;
        private readonly IVerifyEmailRequestValidator _verifyEmailRequestValidator;
        private readonly IResendVerificationRequestValidator _resendVerificationRequestValidator;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IHostEnvironment _hostEnvironment;

        public AuthService(
            LuminoDbContext dbContext,
            IConfiguration configuration,
            IRegisterRequestValidator registerRequestValidator,
            ILoginRequestValidator loginRequestValidator,
            IForgotPasswordRequestValidator forgotPasswordRequestValidator,
            IResetPasswordRequestValidator resetPasswordRequestValidator,
            IVerifyEmailRequestValidator verifyEmailRequestValidator,
            IResendVerificationRequestValidator resendVerificationRequestValidator,
            IEmailSender emailSender,
            IOpenIdTokenValidator openIdTokenValidator,
            IHostEnvironment hostEnvironment,
            IPasswordHasher passwordHasher)
        {
            _dbContext = dbContext;
            _configuration = configuration;
            _emailSender = emailSender;
            _openIdTokenValidator = openIdTokenValidator;
            _registerRequestValidator = registerRequestValidator;
            _loginRequestValidator = loginRequestValidator;
            _forgotPasswordRequestValidator = forgotPasswordRequestValidator;
            _resetPasswordRequestValidator = resetPasswordRequestValidator;
            _verifyEmailRequestValidator = verifyEmailRequestValidator;
            _resendVerificationRequestValidator = resendVerificationRequestValidator;
            _hostEnvironment = hostEnvironment;
            _passwordHasher = passwordHasher;
        }

        public AuthResponse Register(RegisterRequest request)
        {
            _registerRequestValidator.Validate(request);

            var normalizedEmail = request.Email.Trim();

            var existingUser = _dbContext.Users.FirstOrDefault(x => x.Email == normalizedEmail);
            if (existingUser != null)
            {
                // Якщо користувач уже існує, але email не підтверджено - просто повторно відправляємо підтвердження.
                if (!existingUser.IsEmailVerified)
                {
                    CreateAndSendEmailVerification(existingUser, ip: null, userAgent: null);

                    return new AuthResponse
                    {
                        Token = null,
                        RefreshToken = null,
                        RequiresEmailVerification = true
                    };
                }

                throw new ConflictException("Користувач з таким email уже існує. Увійдіть у свій профіль або скористайтеся відновленням пароля.");
            }

            var passwordHash = _passwordHasher.Hash(request.Password);

            var native = string.IsNullOrWhiteSpace(request.NativeLanguageCode)
                ? null
                : request.NativeLanguageCode.Trim().ToLowerInvariant();

            var target = string.IsNullOrWhiteSpace(request.TargetLanguageCode)
                ? SupportedLanguages.DefaultTargetLanguageCode
                : request.TargetLanguageCode.Trim().ToLowerInvariant();

            if (!string.IsNullOrWhiteSpace(target) && string.IsNullOrWhiteSpace(native))
            {
                native = SupportedLanguages.DefaultNativeLanguageCode;
            }

            var user = new User
            {
                Username = NormalizeUsernameOrNull(request.Username),
                Email = normalizedEmail,
                PasswordHash = passwordHash,
                IsEmailVerified = false,
                Role = Role.User,
                CreatedAt = DateTime.UtcNow,
                NativeLanguageCode = native,
                TargetLanguageCode = target,
                AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? SupportedAvatars.GetDefaultAvatarUrl(_configuration) : request.AvatarUrl!.Trim(),
                Hearts = 5,
                HeartsUpdatedAtUtc = DateTime.UtcNow,
                Crystals = 0,
                Theme = "light"
            };

            if (string.IsNullOrWhiteSpace(user.Username))
            {
                user.Username = GenerateUniqueUsernameFromEmail(normalizedEmail);
            }
            else
            {
                EnsureUsernameIsUniqueOrThrow(user.Username);
            }

            _dbContext.Users.Add(user);
            _dbContext.SaveChanges();

            EnsureActiveCourseForTargetLanguage(user.Id, user.TargetLanguageCode);
            CreateAndSendEmailVerification(user, ip: null, userAgent: null);

            return new AuthResponse
            {
                Token = null,
                RefreshToken = null,
                RequiresEmailVerification = true
            };
        }

        public AuthResponse Login(LoginRequest request)
        {
            _loginRequestValidator.Validate(request);

            var login = !string.IsNullOrWhiteSpace(request.Login)
                ? request.Login.Trim()
                : request.Email.Trim();

            User? user;

            if (login.Contains('@'))
            {
                user = _dbContext.Users.FirstOrDefault(x => x.Email == login);
            }
            else
            {
                user = _dbContext.Users.FirstOrDefault(x => x.Username == login);
            }
            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid credentials");
            }

            EnsureUserIsNotBlocked(user);

            if (!user.IsEmailVerified)
            {
                throw new EmailNotVerifiedException("Email not verified");
            }

            var isPasswordValid = _passwordHasher.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                throw new UnauthorizedAccessException("Invalid credentials");
            }

            // Auto-upgrade legacy SHA256 to PBKDF2
            if (_passwordHasher.NeedsRehash(user.PasswordHash))
            {
                user.PasswordHash = _passwordHasher.Hash(request.Password);
                _dbContext.SaveChanges();
            }

            EnsureUserIsNotBlocked(user);
            PrepareUserForAuthenticatedSession(user);

            var sessionStartedAtUtc = DateTime.UtcNow;

            StartNewUserSession(user, saveChanges: false, nowUtc: sessionStartedAtUtc);
            var refreshToken = CreateRefreshToken(user.Id, limitActiveTokens: false, saveChanges: false, nowUtc: sessionStartedAtUtc);
            _dbContext.SaveChanges();

            var accessToken = GenerateJwtToken(user);

            return new AuthResponse
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                RequiresEmailVerification = false
            };
        }

        public AuthResponse OAuthGoogle(OAuthLoginRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            if (string.IsNullOrWhiteSpace(request.IdToken))
            {
                throw new ArgumentException("IdToken is required");
            }

            var info = _openIdTokenValidator.ValidateGoogleIdToken(request.IdToken.Trim());

            return LoginOrCreateExternalUser(
                provider: "google",
                providerUserId: info.Subject,
                email: info.Email,
                name: info.Name,
                pictureUrl: info.PictureUrl,
                requestedUsername: request.Username,
                requestedAvatarUrl: request.AvatarUrl
            );
        }

        private AuthResponse LoginOrCreateExternalUser(
            string provider,
            string providerUserId,
            string? email,
            string? name,
            string? pictureUrl,
            string? requestedUsername,
            string? requestedAvatarUrl
        )
        {
            var external = _dbContext.UserExternalLogins
                .FirstOrDefault(x => x.Provider == provider && x.ProviderUserId == providerUserId);

            User user;

            if (external != null)
            {
                user = _dbContext.Users.First(x => x.Id == external.UserId);
            }
            else
            {
                if (string.IsNullOrWhiteSpace(email))
                {
                    // Apple may omit email on subsequent logins. If the external login is not linked yet,
                    // we cannot safely create/link a user.
                    throw new ForbiddenAccessException("Apple не передав email. Увійдіть тим самим Apple акаунтом ще раз (щоб він був прив’язаний), або використайте вхід через email/пароль.");
                }

                var normalizedEmail = email.Trim();

                var existingUser = _dbContext.Users.FirstOrDefault(x => x.Email == normalizedEmail);

                if (existingUser == null)
                {
                    user = new User
                    {
                        Email = normalizedEmail,
                        PasswordHash = _passwordHasher.Hash(GenerateRandomPassword()),
                        IsEmailVerified = true,
                        Role = Role.User,
                        CreatedAt = DateTime.UtcNow,
                        Username = BuildOAuthUsername(requestedUsername, name, normalizedEmail),
                        AvatarUrl = BuildOAuthAvatarUrl(requestedAvatarUrl, pictureUrl),
                        TargetLanguageCode = SupportedLanguages.DefaultTargetLanguageCode,
                        NativeLanguageCode = SupportedLanguages.DefaultNativeLanguageCode,
                        HeartsUpdatedAtUtc = DateTime.UtcNow,
                        Theme = "light"
                    };

                    _dbContext.Users.Add(user);
                    _dbContext.SaveChanges();
                    EnsureActiveCourseForTargetLanguage(user.Id, user.TargetLanguageCode);
                }
                else
                {
                    user = existingUser;

                    // Якщо користувач існує і зайшов через OAuth з тим самим email - вважаємо email підтвердженим.
                    if (!user.IsEmailVerified)
                    {
                        user.IsEmailVerified = true;
                        _dbContext.SaveChanges();
                    }
                }

                external = new UserExternalLogin
                {
                    UserId = user.Id,
                    Provider = provider,
                    ProviderUserId = providerUserId,
                    Email = normalizedEmail,
                    CreatedAtUtc = DateTime.UtcNow
                };

                _dbContext.UserExternalLogins.Add(external);
                _dbContext.SaveChanges();
            }

            EnsureUserIsNotBlocked(user);
            PrepareUserForAuthenticatedSession(user);

            var sessionStartedAtUtc = DateTime.UtcNow;

            StartNewUserSession(user, saveChanges: false, nowUtc: sessionStartedAtUtc);
            var refreshToken = CreateRefreshToken(user.Id, limitActiveTokens: false, saveChanges: false, nowUtc: sessionStartedAtUtc);
            _dbContext.SaveChanges();

            var accessToken = GenerateJwtToken(user);

            return new AuthResponse
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                RequiresEmailVerification = false
            };
        }

        public AuthResponse VerifyEmail(VerifyEmailRequest request, string? ip, string? userAgent)
        {
            _verifyEmailRequestValidator.Validate(request);

            var token = NormalizeIncomingToken(request.Token);
            var tokenHash = HashToken(token);

            var nowUtc = DateTime.UtcNow;

            var entity = _dbContext.EmailVerificationTokens
                .FirstOrDefault(x => x.TokenHash == tokenHash);

            if (entity == null)
            {
                throw new UnauthorizedAccessException("Invalid token");
            }

            if (entity.UsedAt != null)
            {
                throw new UnauthorizedAccessException("Token already used");
            }

            if (entity.ExpiresAt <= nowUtc)
            {
                throw new UnauthorizedAccessException("Token expired");
            }

            var user = _dbContext.Users.FirstOrDefault(x => x.Id == entity.UserId);
            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid token");
            }

            user.IsEmailVerified = true;
            entity.UsedAt = nowUtc;

            _dbContext.SaveChanges();

            EnsureDefaultTargetLanguage(user);

            return new AuthResponse
            {
                Token = null,
                RefreshToken = null,
                RequiresEmailVerification = false
            };
        }

        public ResendVerificationResponse ResendVerification(ResendVerificationRequest request, string? ip, string? userAgent)
        {
            _resendVerificationRequestValidator.Validate(request);

            var email = request.Email.Trim();

            var user = _dbContext.Users.FirstOrDefault(x => x.Email == email);

            // Always respond OK to avoid account enumeration
            if (user == null)
            {
                return new ResendVerificationResponse
                {
                    IsSent = true
                };
            }

            if (user.IsEmailVerified)
            {
                return new ResendVerificationResponse
                {
                    IsSent = true
                };
            }

            CreateAndSendEmailVerification(user, ip, userAgent);

            return new ResendVerificationResponse
            {
                IsSent = true
            };
        }


        private void PrepareUserForAuthenticatedSession(User user)
        {
            if (user == null)
            {
                return;
            }

            if (user.Role == Role.Admin)
            {
                EnsureAdminHasNoLearningState(user);
                return;
            }

            EnsureDefaultTargetLanguage(user);
        }

        private void EnsureAdminHasNoLearningState(User user)
        {
            var hasChanges = false;

            if (!string.IsNullOrWhiteSpace(user.NativeLanguageCode))
            {
                user.NativeLanguageCode = null;
                hasChanges = true;
            }

            if (!string.IsNullOrWhiteSpace(user.TargetLanguageCode))
            {
                user.TargetLanguageCode = null;
                hasChanges = true;
            }

            var userCourses = _dbContext.UserCourses.Where(x => x.UserId == user.Id).ToList();
            if (userCourses.Count > 0)
            {
                _dbContext.UserCourses.RemoveRange(userCourses);
                hasChanges = true;
            }

            if (hasChanges)
            {
                _dbContext.SaveChanges();
            }
        }

        private void EnsureDefaultTargetLanguage(User user)
        {
            if (user == null)
            {
                return;
            }

            var targetLanguageCode = SupportedLanguages.Normalize(user.TargetLanguageCode);

            if (string.IsNullOrWhiteSpace(targetLanguageCode))
            {
                targetLanguageCode = SupportedLanguages.DefaultTargetLanguageCode;
                user.TargetLanguageCode = targetLanguageCode;

                if (string.IsNullOrWhiteSpace(user.NativeLanguageCode))
                {
                    user.NativeLanguageCode = SupportedLanguages.DefaultNativeLanguageCode;
                }

                _dbContext.SaveChanges();
            }

            EnsureActiveCourseForTargetLanguage(user.Id, targetLanguageCode);
        }

        private void EnsureActiveCourseForTargetLanguage(int userId, string? targetLanguageCode)
        {
            var normalizedTargetLanguageCode = SupportedLanguages.Normalize(targetLanguageCode);

            if (string.IsNullOrWhiteSpace(normalizedTargetLanguageCode))
            {
                return;
            }

            var course = _dbContext.Courses
                .Where(x => x.IsPublished && x.LanguageCode == normalizedTargetLanguageCode)
                .OrderByDescending(x => x.Title.Contains("A1"))
                .ThenBy(x => x.Id)
                .FirstOrDefault();

            if (course == null)
            {
                return;
            }

            var nowUtc = DateTime.UtcNow;
            var hasChanges = false;
            var myCourses = _dbContext.UserCourses.Where(x => x.UserId == userId).ToList();

            foreach (var item in myCourses.Where(x => x.IsActive && x.CourseId != course.Id))
            {
                item.IsActive = false;
                hasChanges = true;
            }

            var existing = myCourses.FirstOrDefault(x => x.CourseId == course.Id);

            if (existing == null)
            {
                _dbContext.UserCourses.Add(new UserCourse
                {
                    UserId = userId,
                    CourseId = course.Id,
                    IsActive = true,
                    IsCompleted = false,
                    StartedAt = nowUtc,
                    LastOpenedAt = nowUtc
                });

                hasChanges = true;
            }
            else
            {
                if (!existing.IsActive)
                {
                    existing.IsActive = true;
                    hasChanges = true;
                }

                existing.LastOpenedAt = nowUtc;
                hasChanges = true;
            }

            if (hasChanges)
            {
                _dbContext.SaveChanges();
            }

            EnsureUserLessonProgressSeedForCourse(userId, course.Id);
        }

        private void EnsureUserLessonProgressSeedForCourse(int userId, int courseId)
        {
            if (userId <= 0 || courseId <= 0)
            {
                return;
            }

            var orderedLessonIds =
                (from t in _dbContext.Topics.AsNoTracking()
                 join l in _dbContext.Lessons.AsNoTracking() on t.Id equals l.TopicId
                 where t.CourseId == courseId
                 orderby (t.Order <= 0 ? int.MaxValue : t.Order), t.Id, (l.Order <= 0 ? int.MaxValue : l.Order), l.Id
                 select l.Id)
                .Distinct()
                .ToList();

            if (orderedLessonIds.Count == 0)
            {
                return;
            }

            var existingProgresses = _dbContext.UserLessonProgresses
                .AsNoTracking()
                .Where(x => x.UserId == userId && orderedLessonIds.Contains(x.LessonId))
                .Select(x => new { x.LessonId, x.IsUnlocked })
                .ToList();

            if (existingProgresses.Count == orderedLessonIds.Count)
            {
                return;
            }

            var existingLessonIds = existingProgresses
                .Select(x => x.LessonId)
                .ToHashSet();

            var hasUnlockedExistingLesson = existingProgresses.Any(x => x.IsUnlocked);
            var firstLessonId = orderedLessonIds[0];

            var missingProgresses = orderedLessonIds
                .Where(x => !existingLessonIds.Contains(x))
                .Select(x => new UserLessonProgress
                {
                    UserId = userId,
                    LessonId = x,
                    IsUnlocked = x == firstLessonId && !hasUnlockedExistingLesson,
                    IsCompleted = false,
                    BestScore = 0,
                    LastAttemptAt = null
                })
                .ToList();

            if (missingProgresses.Count == 0)
            {
                return;
            }

            _dbContext.UserLessonProgresses.AddRange(missingProgresses);
            _dbContext.SaveChanges();
        }

        private string BuildOAuthUsername(string? requestedUsername, string? name, string email)
        {
            if (!string.IsNullOrWhiteSpace(requestedUsername))
            {
                var candidate = AccountValidationRules.BuildUsernameCandidate(requestedUsername);
                return EnsureUniqueUsername(candidate);
            }

            if (!string.IsNullOrWhiteSpace(name))
            {
                var cleaned = AccountValidationRules.BuildUsernameCandidate(name);
                return EnsureUniqueUsername(cleaned);
            }

            var baseName = AccountValidationRules.BuildUsernameFromEmail(email.Split('@')[0]);
            return EnsureUniqueUsername(baseName);
        }

        private string? BuildOAuthAvatarUrl(string? requestedAvatarUrl, string? tokenPictureUrl)
        {
            if (!string.IsNullOrWhiteSpace(requestedAvatarUrl))
            {
                return requestedAvatarUrl.Trim();
            }

            if (!string.IsNullOrWhiteSpace(tokenPictureUrl))
            {
                return tokenPictureUrl.Trim();
            }

            return SupportedAvatars.GetDefaultAvatarUrl(_configuration);
        }

        private string EnsureUniqueUsername(string baseUsername)
        {
            var username = baseUsername;

            var exists = _dbContext.Users.Any(x => x.Username == username);
            if (!exists)
            {
                return username;
            }

            for (var i = 1; i <= 9999; i++)
            {
                var suffix = i.ToString();
                var maxBase = 32 - suffix.Length;
                var trimmed = baseUsername.Length > maxBase ? baseUsername.Substring(0, maxBase) : baseUsername;
                var candidate = trimmed + suffix;

                if (!_dbContext.Users.Any(x => x.Username == candidate))
                {
                    return candidate;
                }
            }

            var fallbackSuffix = Guid.NewGuid().ToString("N").Substring(0, 4);
            var maxBaseLength = AccountValidationRules.UsernameMaxLength - fallbackSuffix.Length;
            var trimmedBaseUsername = baseUsername.Length > maxBaseLength ? baseUsername.Substring(0, maxBaseLength).Trim(' ', '.', '_', '-') : baseUsername;

            if (trimmedBaseUsername.Length < AccountValidationRules.UsernameMinLength)
            {
                trimmedBaseUsername = "user";
            }

            return trimmedBaseUsername + fallbackSuffix;
        }

        private static string GenerateRandomPassword()
        {
            // random password only to satisfy PasswordHash requirement (OAuth users can still use reset-password later)
            return Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        }

        public ForgotPasswordResponse ForgotPassword(ForgotPasswordRequest request, string? ip, string? userAgent)
        {
            _forgotPasswordRequestValidator.Validate(request);

            var email = request.Email.Trim();

            var user = _dbContext.Users.FirstOrDefault(x => x.Email == email);

            // Always respond OK to avoid account enumeration
            if (user == null)
            {
                return new ForgotPasswordResponse
                {
                    IsSent = true
                };
            }

            var rawToken = GeneratePasswordResetToken();
            var tokenHash = HashToken(rawToken);

            var nowUtc = DateTime.UtcNow;
            var expiresAtUtc = nowUtc.AddMinutes(30);

            var entity = new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = tokenHash,
                CreatedAt = nowUtc,
                ExpiresAt = expiresAtUtc,
                Ip = string.IsNullOrWhiteSpace(ip) ? null : ip.Trim(),
                UserAgent = string.IsNullOrWhiteSpace(userAgent) ? null : userAgent.Trim()
            };

            _dbContext.PasswordResetTokens.Add(entity);
            _dbContext.SaveChanges();

            var resetLink = BuildPasswordResetLink(rawToken, user.Email);

            var subject = "Lumino — Відновлення пароля";
            var body = BuildForgotPasswordEmailBody(user, resetLink, expiresAtUtc, rawToken);

            _emailSender.Send(user.Email, subject, body);

            return new ForgotPasswordResponse
            {
                IsSent = true,
                ResetToken = null,
                ExpiresAtUtc = null
            };
        }

        public void ResetPassword(ResetPasswordRequest request)
        {
            _resetPasswordRequestValidator.Validate(request);

            var token = NormalizeIncomingToken(request.Token);
            var tokenHash = HashToken(token);

            var nowUtc = DateTime.UtcNow;

            var reset = _dbContext.PasswordResetTokens
                .FirstOrDefault(x => x.TokenHash == tokenHash);

            if (reset == null)
            {
                throw new UnauthorizedAccessException("Invalid token");
            }

            if (reset.UsedAt != null)
            {
                throw new UnauthorizedAccessException("Token already used");
            }

            if (reset.ExpiresAt <= nowUtc)
            {
                throw new UnauthorizedAccessException("Token expired");
            }

            var user = _dbContext.Users.FirstOrDefault(x => x.Id == reset.UserId);

            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid token");
            }

            user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
            reset.UsedAt = nowUtc;

            RevokeAllActiveRefreshTokens(user.Id, nowUtc);
            user.SessionVersion++;
            _dbContext.SaveChanges();
        }

        private static string NormalizeIncomingToken(string token)
        {
            var value = token.Trim();

            if (string.IsNullOrWhiteSpace(value))
            {
                return value;
            }

            value = value.Replace("&amp;", "&", StringComparison.OrdinalIgnoreCase);

            var tokenIndex = value.IndexOf("token=", StringComparison.OrdinalIgnoreCase);
            if (tokenIndex >= 0)
            {
                value = value[(tokenIndex + "token=".Length)..];
            }

            var separatorIndex = value.IndexOf('&');
            if (separatorIndex >= 0)
            {
                value = value[..separatorIndex];
            }

            return Uri.UnescapeDataString(value).Trim();
        }

        private static void EnsureUserIsNotBlocked(User user)
        {
            if (!user.BlockedUntilUtc.HasValue)
            {
                return;
            }

            var blockedUntilUtc = user.BlockedUntilUtc.Value;

            if (blockedUntilUtc.Kind == DateTimeKind.Local)
            {
                blockedUntilUtc = blockedUntilUtc.ToUniversalTime();
            }
            else if (blockedUntilUtc.Kind == DateTimeKind.Unspecified)
            {
                blockedUntilUtc = DateTime.SpecifyKind(blockedUntilUtc, DateTimeKind.Utc);
            }

            if (blockedUntilUtc > DateTime.UtcNow)
            {
                throw new ForbiddenAccessException($"User is blocked until {blockedUntilUtc:yyyy-MM-dd HH:mm} UTC.");
            }
        }

        private string? NormalizeUsernameOrNull(string? username)
        {
            if (string.IsNullOrWhiteSpace(username))
            {
                return null;
            }

            return username.Trim();
        }

        private void EnsureUsernameIsUniqueOrThrow(string username)
        {
            var existing = _dbContext.Users.FirstOrDefault(x => x.Username == username);

            if (existing != null)
            {
                throw new ConflictException("Користувач з таким username уже існує.");
            }
        }

        private string GenerateUniqueUsernameFromEmail(string email)
        {
            var local = email.Split('@')[0];
            var baseName = AccountValidationRules.BuildUsernameFromEmail(local);

            if (baseName.Length > 20)
            {
                baseName = baseName.Substring(0, 20).Trim(' ', '.', '_', '-');
            }

            if (baseName.Length < AccountValidationRules.UsernameMinLength)
            {
                baseName = "user";
            }

            var candidate = baseName;
            var suffix = 1;

            while (_dbContext.Users.Any(x => x.Username == candidate))
            {
                suffix++;
                var suffixValue = suffix.ToString();
                var maxBaseLength = AccountValidationRules.UsernameMaxLength - suffixValue.Length;
                var trimmedBaseName = baseName.Length > maxBaseLength ? baseName.Substring(0, maxBaseLength).Trim(' ', '.', '_', '-') : baseName;

                if (trimmedBaseName.Length < AccountValidationRules.UsernameMinLength)
                {
                    trimmedBaseName = "user";
                }

                candidate = $"{trimmedBaseName}{suffixValue}";
            }

            return candidate;
        }

        private static string GeneratePasswordResetToken()
        {
            var bytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);

            return Base64UrlEncode(bytes);
        }

        private static string GenerateEmailVerificationToken()
        {
            var bytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);

            return Base64UrlEncode(bytes);
        }

        public AuthResponse Refresh(RefreshTokenRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                throw new ArgumentException("RefreshToken is required");
            }

            var refreshTokenHash = HashToken(request.RefreshToken);

            var tokenEntity = _dbContext.RefreshTokens.FirstOrDefault(x => x.TokenHash == refreshTokenHash);
            if (tokenEntity == null)
            {
                throw new UnauthorizedAccessException("Invalid refresh token");
            }

            if (tokenEntity.RevokedAt != null)
            {
                throw new UnauthorizedAccessException("Refresh token revoked");
            }

            if (tokenEntity.ExpiresAt <= DateTime.UtcNow)
            {
                throw new UnauthorizedAccessException("Refresh token expired");
            }

            var user = _dbContext.Users.FirstOrDefault(x => x.Id == tokenEntity.UserId);
            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid refresh token");
            }

            EnsureUserIsNotBlocked(user);
            PrepareUserForAuthenticatedSession(user);

            var newRefreshToken = GenerateRefreshToken();
            var newRefreshTokenHash = HashToken(newRefreshToken);

            tokenEntity.RevokedAt = DateTime.UtcNow;
            tokenEntity.ReplacedByTokenHash = newRefreshTokenHash;

            var refreshSection = _configuration.GetSection("RefreshToken");
            var expiresDaysText = refreshSection["ExpiresDays"];

            if (!int.TryParse(expiresDaysText, out var expiresDays))
            {
                expiresDays = 7;
            }

            if (expiresDays < 1)
            {
                expiresDays = 1;
            }

            var newEntity = new RefreshToken
            {
                UserId = user.Id,
                TokenHash = newRefreshTokenHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(expiresDays)
            };

            _dbContext.RefreshTokens.Add(newEntity);

            // Спочатку зберігаємо, щоб LimitActiveTokens працював по реальним даним
            _dbContext.SaveChanges();

            LimitActiveTokens(user.Id);

            _dbContext.SaveChanges();

            var newAccessToken = GenerateJwtToken(user);

            return new AuthResponse
            {
                Token = newAccessToken,
                RefreshToken = newRefreshToken,
                RequiresEmailVerification = false
            };
        }

        public void Logout(RefreshTokenRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                throw new ArgumentException("RefreshToken is required");
            }

            var refreshTokenHash = HashToken(request.RefreshToken);

            var tokenEntity = _dbContext.RefreshTokens.FirstOrDefault(x => x.TokenHash == refreshTokenHash);
            if (tokenEntity == null)
            {
                return;
            }

            if (tokenEntity.RevokedAt != null)
            {
                return;
            }

            var now = DateTime.UtcNow;

            tokenEntity.RevokedAt = now;

            var hasNewerActiveToken = _dbContext.RefreshTokens.Any(x =>
                x.UserId == tokenEntity.UserId
                && x.Id != tokenEntity.Id
                && x.RevokedAt == null
                && x.ExpiresAt > now
                && x.CreatedAt > tokenEntity.CreatedAt
            );

            var user = _dbContext.Users.FirstOrDefault(x => x.Id == tokenEntity.UserId);
            if (user != null && !hasNewerActiveToken)
            {
                user.SessionVersion++;
            }

            _dbContext.SaveChanges();
        }

        private void LimitActiveTokens(int userId)
        {
            var refreshSection = _configuration.GetSection("RefreshToken");
            var maxActiveTokensText = refreshSection["MaxActiveTokens"];

            if (!int.TryParse(maxActiveTokensText, out var maxActiveTokens))
            {
                maxActiveTokens = 3;
            }

            if (maxActiveTokens <= 0)
            {
                return;
            }

            var now = DateTime.UtcNow;

            var activeTokens = _dbContext.RefreshTokens
                .Where(x =>
                    x.UserId == userId
                    && x.RevokedAt == null
                    && x.ExpiresAt > now
                )
                .OrderByDescending(x => x.CreatedAt)
                .ToList();

            if (activeTokens.Count <= maxActiveTokens)
            {
                return;
            }

            var tokensToRevoke = activeTokens
                .Skip(maxActiveTokens)
                .ToList();

            foreach (var token in tokensToRevoke)
            {
                token.RevokedAt = now;
            }
        }

        private static string GenerateRefreshToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(bytes);
        }

        private string BuildPasswordResetLink(string token, string? email)
        {
            var baseUrl = GetFrontendBaseUrl();
            var encodedToken = Uri.EscapeDataString(token);
            var link = $"{baseUrl}/reset-password?token={encodedToken}";

            if (string.IsNullOrWhiteSpace(email))
            {
                return link;
            }

            var encodedEmail = Uri.EscapeDataString(email.Trim());
            return $"{link}&email={encodedEmail}";
        }

        private string BuildEmailVerificationLink(string token, string? email)
        {
            var baseUrl = GetFrontendBaseUrl();
            var encodedToken = Uri.EscapeDataString(token);
            var link = $"{baseUrl}/verify-email?token={encodedToken}";

            if (string.IsNullOrWhiteSpace(email))
            {
                return link;
            }

            var encodedEmail = Uri.EscapeDataString(email.Trim());
            return $"{link}&email={encodedEmail}";
        }

        private string GetFrontendBaseUrl()
        {
            var baseUrl = _configuration["Email:FrontendBaseUrl"];

            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                baseUrl = "http://localhost:5173";
            }

            baseUrl = baseUrl.Trim();

            if (baseUrl.EndsWith("/"))
            {
                baseUrl = baseUrl.TrimEnd('/');
            }

            return baseUrl;
        }

        private string BuildForgotPasswordEmailBody(User user, string resetLink, DateTime expiresAtUtc, string rawToken)
        {
            var username = string.IsNullOrWhiteSpace(user.Username) ? "друже" : user.Username.Trim();

            return BuildActionEmailBody(
                title: "Відновлення пароля",
                greeting: $"Привіт, {username}!",
                description: "Ми отримали запит на зміну пароля для вашого профілю Lumino. Натисніть кнопку нижче, щоб створити новий пароль.",
                buttonText: "Змінити пароль",
                buttonLink: resetLink,
                accentColor: "#7FA8D9",
                helperText: "Якщо ви не надсилали цей запит, просто проігноруйте лист — ваш профіль залишиться захищеним.",
                expiresAtUtc: expiresAtUtc,
                rawToken: rawToken
            );
        }

        private string BuildVerificationEmailBody(User user, string verifyLink, DateTime expiresAtUtc, string rawToken)
        {
            var username = string.IsNullOrWhiteSpace(user.Username) ? "друже" : user.Username.Trim();

            return BuildActionEmailBody(
                title: "Підтвердження електронної адреси",
                greeting: $"Вітаємо, {username}!",
                description: "Завершіть реєстрацію в Lumino та підтвердьте вашу електронну адресу. Після цього ви зможете увійти до свого профілю.",
                buttonText: "Підтвердити пошту",
                buttonLink: verifyLink,
                accentColor: "#5C85B4",
                helperText: "Якщо ви вже відкрили лист на іншому пристрої, кнопка для повторного надсилання залишиться доступною на сторінці підтвердження.",
                expiresAtUtc: expiresAtUtc,
                rawToken: rawToken
            );
        }

        private static string BuildActionEmailBody(
            string title,
            string greeting,
            string description,
            string buttonText,
            string buttonLink,
            string accentColor,
            string helperText,
            DateTime expiresAtUtc,
            string rawToken)
        {
            var safeTitle = WebUtility.HtmlEncode(title);
            var safeGreeting = WebUtility.HtmlEncode(greeting);
            var safeDescription = WebUtility.HtmlEncode(description);
            var safeButtonText = WebUtility.HtmlEncode(buttonText);
            var safeButtonLink = WebUtility.HtmlEncode(buttonLink);
            var safeHelperText = WebUtility.HtmlEncode(helperText);
            var safeToken = WebUtility.HtmlEncode(rawToken);
            var safeAccentColor = WebUtility.HtmlEncode(accentColor);
            var expiresText = WebUtility.HtmlEncode(expiresAtUtc.ToString("dd.MM.yyyy HH:mm 'UTC'"));

            return $$"""
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{safeTitle}}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,'Segoe UI',sans-serif;color:#26415e;">
  <div style="margin:0;padding:32px 16px;background:linear-gradient(135deg,#d9ebff 0%,#f6e3f3 100%);">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;border-collapse:collapse;">
      <tr>
        <td style="padding:0;">
          <div style="background:rgba(255,255,255,0.82);border:1px solid rgba(255,255,255,0.85);border-radius:32px;box-shadow:0 18px 40px rgba(97,127,158,0.14);padding:40px 36px;">
            <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:rgba(127,168,217,0.16);color:#5c85b4;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Lumino</div>
            <h1 style="margin:20px 0 12px;font-size:34px;line-height:1.15;font-weight:700;color:#26415e;">{{safeTitle}}</h1>
            <p style="margin:0 0 12px;font-size:20px;line-height:1.45;font-weight:700;color:#26415e;">{{safeGreeting}}</p>
            <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#4f6b88;">{{safeDescription}}</p>
            <div style="margin:0 0 28px;padding:24px;border-radius:24px;background:rgba(255,255,255,0.72);border:1px solid rgba(92,133,180,0.16);">
              <a href="{{safeButtonLink}}" style="display:inline-block;padding:18px 34px;border-radius:16px;background:{{safeAccentColor}};color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;line-height:1;">{{safeButtonText}}</a>
              <p style="margin:18px 0 0;font-size:14px;line-height:1.65;color:#6a7d90;">Посилання активне до <strong>{{expiresText}}</strong>.</p>
            </div>
            <div style="margin:0 0 20px;padding:20px 22px;border-radius:20px;background:rgba(245,247,251,0.96);border:1px solid rgba(106,125,144,0.18);">
              <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#26415e;font-weight:700;">Код із листа</p>
              <p style="margin:0;font-size:14px;line-height:1.8;color:#4f6b88;word-break:break-word;">{{safeToken}}</p>
            </div>
            <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#6a7d90;">{{safeHelperText}}</p>
            <p style="margin:0;font-size:13px;line-height:1.7;color:#8ca0b5;">Цей лист надіслано автоматично від команди Lumino.</p>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
""";
        }

        private void CreateAndSendEmailVerification(User user, string? ip, string? userAgent)
        {
            if (user == null)
            {
                throw new ArgumentNullException(nameof(user));
            }

            if (user.IsEmailVerified)
            {
                return;
            }

            var rawToken = GenerateEmailVerificationToken();
            var tokenHash = HashToken(rawToken);

            var nowUtc = DateTime.UtcNow;

            // 24 години на підтвердження
            var expiresAtUtc = nowUtc.AddHours(24);

            var entity = new EmailVerificationToken
            {
                UserId = user.Id,
                TokenHash = tokenHash,
                CreatedAt = nowUtc,
                ExpiresAt = expiresAtUtc,
                Ip = string.IsNullOrWhiteSpace(ip) ? null : ip.Trim(),
                UserAgent = string.IsNullOrWhiteSpace(userAgent) ? null : userAgent.Trim()
            };

            _dbContext.EmailVerificationTokens.Add(entity);
            _dbContext.SaveChanges();

            var verifyLink = BuildEmailVerificationLink(rawToken, user.Email);

            var subject = "Lumino — Підтвердження пошти";
            var body = BuildVerificationEmailBody(user, verifyLink, expiresAtUtc, rawToken);

            _emailSender.Send(user.Email, subject, body);
        }

        private static string HashToken(string token)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(token);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        private static string Base64UrlEncode(byte[] bytes)
        {
            var base64 = Convert.ToBase64String(bytes);

            return base64
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");
        }

        private void StartNewUserSession(User user, bool saveChanges = true, DateTime? nowUtc = null)
        {
            if (user == null)
            {
                throw new ArgumentNullException(nameof(user));
            }

            var sessionStartedAtUtc = nowUtc ?? DateTime.UtcNow;

            RevokeAllActiveRefreshTokens(user.Id, sessionStartedAtUtc);
            user.SessionVersion++;

            if (saveChanges)
            {
                _dbContext.SaveChanges();
            }
        }

        private void RevokeAllActiveRefreshTokens(int userId, DateTime? nowUtc = null)
        {
            var now = nowUtc ?? DateTime.UtcNow;

            var activeTokens = _dbContext.RefreshTokens
                .Where(x => x.UserId == userId && x.RevokedAt == null && x.ExpiresAt > now)
                .ToList();

            foreach (var token in activeTokens)
            {
                token.RevokedAt = now;
            }
        }

        private string CreateRefreshToken(int userId, bool limitActiveTokens = true, bool saveChanges = true, DateTime? nowUtc = null)
        {
            var refreshToken = GenerateRefreshToken();
            var refreshTokenHash = HashToken(refreshToken);

            var refreshSection = _configuration.GetSection("RefreshToken");
            var expiresDaysText = refreshSection["ExpiresDays"];

            if (!int.TryParse(expiresDaysText, out var expiresDays))
            {
                expiresDays = 7;
            }

            if (expiresDays < 1)
            {
                expiresDays = 1;
            }

            var createdAtUtc = nowUtc ?? DateTime.UtcNow;

            var entity = new RefreshToken
            {
                UserId = userId,
                TokenHash = refreshTokenHash,
                CreatedAt = createdAtUtc,
                ExpiresAt = createdAtUtc.AddDays(expiresDays)
            };

            _dbContext.RefreshTokens.Add(entity);

            if (!saveChanges)
            {
                return refreshToken;
            }

            // Спочатку зберігаємо новий refresh token, щоб LimitActiveTokens бачив його у базі
            _dbContext.SaveChanges();

            if (limitActiveTokens)
            {
                LimitActiveTokens(userId);

                // Зберігаємо можливі revocations
                _dbContext.SaveChanges();
            }

            return refreshToken;
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["Key"]!)
            );

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim(ClaimsUtils.SessionVersionClaimType, user.SessionVersion.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    int.Parse(jwtSettings["ExpiresMinutes"]!)
                ),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
