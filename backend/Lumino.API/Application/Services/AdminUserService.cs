using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;
using Lumino.Api.Utils;
using Microsoft.EntityFrameworkCore;

namespace Lumino.Api.Application.Services
{
    public class AdminUserService : IAdminUserService
    {
        private const string PrimaryAdminEmail = "admin@lumino.local";

        private readonly LuminoDbContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly IPasswordHasher _passwordHasher;

        public AdminUserService(LuminoDbContext dbContext, IConfiguration configuration, IPasswordHasher passwordHasher)
        {
            _dbContext = dbContext;
            _configuration = configuration;
            _passwordHasher = passwordHasher;
        }

        public List<AdminUserResponse> GetAll()
        {
            var userCourses = _dbContext.UserCourses
                .AsNoTracking()
                .ToList();

            var courseMap = userCourses
                .GroupBy(x => x.UserId)
                .ToDictionary(
                    x => x.Key,
                    x => new
                    {
                        CourseIds = x.Select(z => z.CourseId).Distinct().OrderBy(z => z).ToList(),
                        ActiveCourseId = x.Where(z => z.IsActive).OrderByDescending(z => z.LastOpenedAt).Select(z => (int?)z.CourseId).FirstOrDefault(),
                    });

            var pointsMap = _dbContext.UserProgresses
                .AsNoTracking()
                .ToDictionary(x => x.UserId, x => x.TotalScore);

            var users = _dbContext.Users
                .AsNoTracking()
                .OrderBy(x => x.Username ?? x.Email)
                .ThenBy(x => x.CreatedAt)
                .ToList();

            var result = new List<AdminUserResponse>();

            foreach (var user in users)
            {
                var hasCourseInfo = courseMap.TryGetValue(user.Id, out var courseInfo);
                var isAdmin = user.Role == Role.Admin;

                result.Add(new AdminUserResponse
                {
                    Id = user.Id,
                    Username = user.Username,
                    AvatarUrl = user.AvatarUrl,
                    Email = user.Email,
                    IsEmailVerified = user.IsEmailVerified,
                    Role = user.Role.ToString(),
                    CreatedAt = user.CreatedAt,
                    NativeLanguageCode = isAdmin ? null : user.NativeLanguageCode,
                    TargetLanguageCode = isAdmin ? null : user.TargetLanguageCode,
                    Hearts = isAdmin ? 0 : user.Hearts,
                    Crystals = isAdmin ? 0 : user.Crystals,
                    Theme = string.IsNullOrWhiteSpace(user.Theme) ? "light" : user.Theme,
                    Points = isAdmin ? 0 : (pointsMap.TryGetValue(user.Id, out var points) ? points : 0),
                    CourseIds = isAdmin ? new List<int>() : (hasCourseInfo ? courseInfo!.CourseIds : new List<int>()),
                    ActiveCourseId = isAdmin ? null : (hasCourseInfo ? courseInfo!.ActiveCourseId : null),
                    BlockedUntilUtc = NormalizeBlockedUntilUtc(user.BlockedUntilUtc),
                    IsBlocked = IsUserBlocked(user),
                    IsPrimaryAdmin = IsPrimaryAdminEmail(user.Email)
                });
            }

            return result;
        }

        public AdminUserResponse Create(AdminUserUpsertRequest request, int currentAdminUserId)
        {
            var currentAdmin = GetCurrentAdminOrThrow(currentAdminUserId);
            ValidateRequest(request, isCreate: true);

            var role = ParseRole(request.Role);

            if (role == Role.Admin && !IsPrimaryAdmin(currentAdmin))
            {
                throw new ForbiddenAccessException("Лише основний адміністратор може створювати інших адміністраторів.");
            }

            var email = NormalizeRequiredEmail(request.Email);
            var username = NormalizeUsername(request.Username);
            var blockedUntilUtc = NormalizeBlockedUntilUtc(request.BlockedUntilUtc);
            var theme = NormalizeTheme(request.Theme);
            var courseIds = role == Role.Admin ? new List<int>() : NormalizeCourseIds(request.CourseIds);
            var activeCourseId = role == Role.Admin ? null : request.ActiveCourseId;
            ValidateCourseSelection(courseIds, activeCourseId);
            EnsureUniqueUser(email, username, 0);

            var languages = role == Role.Admin
                ? (NativeLanguageCode: (string?)null, TargetLanguageCode: (string?)null)
                : NormalizeLanguages(request.NativeLanguageCode, request.TargetLanguageCode, courseIds, activeCourseId);

            var user = new User
            {
                Username = username,
                Email = email,
                PasswordHash = _passwordHasher.Hash(request.Password!.Trim()),
                AvatarUrl = NormalizeOptional(request.AvatarUrl),
                Role = role,
                IsEmailVerified = request.IsEmailVerified ?? true,
                CreatedAt = DateTime.UtcNow,
                NativeLanguageCode = languages.NativeLanguageCode,
                TargetLanguageCode = languages.TargetLanguageCode,
                Hearts = role == Role.Admin ? 0 : NormalizeHearts(request.Hearts),
                Crystals = role == Role.Admin ? 0 : Math.Max(0, request.Crystals ?? 0),
                BlockedUntilUtc = blockedUntilUtc,
                Theme = theme,
            };

            _dbContext.Users.Add(user);
            _dbContext.SaveChanges();

            if (blockedUntilUtc.HasValue)
            {
                InvalidateUserSessions(user.Id);
            }

            SyncUserProgress(user.Id, role == Role.Admin ? 0 : Math.Max(0, request.Points ?? 0));
            SyncUserCourses(user, courseIds, activeCourseId, languages.TargetLanguageCode);

            return GetAll().First(x => x.Id == user.Id);
        }

        public AdminUserResponse Update(int id, AdminUserUpsertRequest request, int currentAdminUserId)
        {
            if (id <= 0)
            {
                throw new ArgumentException("Некоректний ідентифікатор користувача.");
            }

            var currentAdmin = GetCurrentAdminOrThrow(currentAdminUserId);
            var user = _dbContext.Users.FirstOrDefault(x => x.Id == id);

            if (user == null)
            {
                throw new KeyNotFoundException("Користувача не знайдено.");
            }

            EnsureCanManageUser(currentAdmin, user);

            var currentPoints = _dbContext.UserProgresses
                .Where(x => x.UserId == user.Id)
                .Select(x => x.TotalScore)
                .FirstOrDefault();

            var currentUserCourses = _dbContext.UserCourses
                .Where(x => x.UserId == user.Id)
                .OrderBy(x => x.CourseId)
                .ToList();

            var currentCourseIds = currentUserCourses
                .Select(x => x.CourseId)
                .Distinct()
                .OrderBy(x => x)
                .ToList();

            var currentActiveCourseId = currentUserCourses
                .Where(x => x.IsActive)
                .OrderByDescending(x => x.LastOpenedAt)
                .Select(x => (int?)x.CourseId)
                .FirstOrDefault();

            var effectiveRequest = BuildEffectiveUpdateRequest(request, user, currentPoints, currentCourseIds, currentActiveCourseId);

            ValidateRequest(effectiveRequest, isCreate: false, currentUsername: user.Username, currentAvatarUrl: user.AvatarUrl);

            var role = ParseRole(effectiveRequest.Role);
            var isTargetPrimaryAdmin = IsPrimaryAdmin(user);

            if (role == Role.Admin && !IsPrimaryAdmin(currentAdmin) && user.Role != Role.Admin)
            {
                throw new ForbiddenAccessException("Лише основний адміністратор може призначати роль адміністратора.");
            }

            if (isTargetPrimaryAdmin)
            {
                if (!string.Equals(effectiveRequest.Email?.Trim(), PrimaryAdminEmail, StringComparison.OrdinalIgnoreCase))
                {
                    throw new ForbiddenAccessException("Email основного адміністратора змінювати не можна.");
                }

                if (role != Role.Admin)
                {
                    throw new ForbiddenAccessException("Роль основного адміністратора змінювати не можна.");
                }
            }

            var email = NormalizeRequiredEmail(effectiveRequest.Email);
            var username = NormalizeUsername(effectiveRequest.Username);
            var blockedUntilUtc = NormalizeBlockedUntilUtc(effectiveRequest.BlockedUntilUtc);
            var theme = NormalizeTheme(effectiveRequest.Theme);
            var courseIds = role == Role.Admin ? new List<int>() : NormalizeCourseIds(effectiveRequest.CourseIds);
            var activeCourseId = role == Role.Admin ? null : effectiveRequest.ActiveCourseId;
            ValidateCourseSelection(courseIds, activeCourseId);
            EnsureUniqueUser(email, username, id);

            var languages = role == Role.Admin
                ? (NativeLanguageCode: (string?)null, TargetLanguageCode: (string?)null)
                : NormalizeLanguages(effectiveRequest.NativeLanguageCode, effectiveRequest.TargetLanguageCode, courseIds, activeCourseId);

            if (id == currentAdminUserId && blockedUntilUtc.HasValue)
            {
                throw new ForbiddenAccessException("Неможливо заблокувати поточного адміністратора.");
            }

            if (isTargetPrimaryAdmin && blockedUntilUtc.HasValue)
            {
                throw new ForbiddenAccessException("Основного адміністратора блокувати не можна.");
            }

            var previousBlockedUntilUtc = NormalizeBlockedUntilUtc(user.BlockedUntilUtc);
            var shouldInvalidateSessions = !Nullable.Equals(previousBlockedUntilUtc, blockedUntilUtc)
                || user.Role != role
                || !string.IsNullOrWhiteSpace(request.Password);

            user.Username = username;
            user.Email = email;
            user.AvatarUrl = NormalizeOptional(effectiveRequest.AvatarUrl);
            user.Role = role;
            user.IsEmailVerified = effectiveRequest.IsEmailVerified ?? true;
            user.NativeLanguageCode = languages.NativeLanguageCode;
            user.TargetLanguageCode = languages.TargetLanguageCode;
            user.Hearts = role == Role.Admin ? 0 : NormalizeHearts(effectiveRequest.Hearts);
            user.Crystals = role == Role.Admin ? 0 : Math.Max(0, effectiveRequest.Crystals ?? 0);
            user.BlockedUntilUtc = blockedUntilUtc;
            user.Theme = theme;

            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                user.PasswordHash = _passwordHasher.Hash(request.Password.Trim());
            }

            _dbContext.SaveChanges();

            if (shouldInvalidateSessions)
            {
                InvalidateUserSessions(user.Id);
            }

            SyncUserProgress(user.Id, role == Role.Admin ? 0 : Math.Max(0, effectiveRequest.Points ?? 0));
            SyncUserCourses(user, courseIds, activeCourseId, languages.TargetLanguageCode);

            return GetAll().First(x => x.Id == user.Id);
        }

        public void Delete(int id, int currentAdminUserId)
        {
            if (id <= 0)
            {
                throw new ArgumentException("Некоректний ідентифікатор користувача.");
            }

            if (id == currentAdminUserId)
            {
                throw new ForbiddenAccessException("Неможливо видалити поточного адміністратора.");
            }

            var currentAdmin = GetCurrentAdminOrThrow(currentAdminUserId);
            var user = _dbContext.Users.FirstOrDefault(x => x.Id == id);

            if (user == null)
            {
                throw new KeyNotFoundException("Користувача не знайдено.");
            }

            EnsureCanManageUser(currentAdmin, user);

            if (IsPrimaryAdmin(user))
            {
                throw new ForbiddenAccessException("Неможливо видалити основного адміністратора.");
            }

            _dbContext.Users.Remove(user);
            _dbContext.SaveChanges();
        }

        private User GetCurrentAdminOrThrow(int currentAdminUserId)
        {
            var currentAdmin = _dbContext.Users.FirstOrDefault(x => x.Id == currentAdminUserId);

            if (currentAdmin == null || currentAdmin.Role != Role.Admin)
            {
                throw new ForbiddenAccessException("Доступ заборонено.");
            }

            return currentAdmin;
        }

        private void EnsureCanManageUser(User currentAdmin, User targetUser)
        {
            if (targetUser.Role != Role.Admin)
            {
                return;
            }

            if (!IsPrimaryAdmin(currentAdmin))
            {
                throw new ForbiddenAccessException("Лише основний адміністратор може змінювати або видаляти адміністраторів.");
            }

            if (IsPrimaryAdmin(targetUser) && targetUser.Id != currentAdmin.Id)
            {
                throw new ForbiddenAccessException("Основного адміністратора не можна змінювати або видаляти.");
            }
        }

        private void ValidateRequest(AdminUserUpsertRequest request, bool isCreate, string? currentUsername = null, string? currentAvatarUrl = null)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var normalizedCurrentUsername = NormalizeUsername(currentUsername);
            var normalizedRequestUsername = NormalizeUsername(request.Username);
            var shouldValidateUsername = isCreate
                || !string.Equals(normalizedRequestUsername, normalizedCurrentUsername, StringComparison.Ordinal);

            if (shouldValidateUsername)
            {
                AccountValidationRules.ValidateUsername(request.Username, required: false);
            }

            AccountValidationRules.ValidateEmail(request.Email);

            if (isCreate && string.IsNullOrWhiteSpace(request.Password))
            {
                throw new ArgumentException("Password is required");
            }

            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                AccountValidationRules.ValidatePasswordForSet(request.Password, fieldName: "Password");
            }

            var normalizedAvatarUrl = NormalizeOptional(request.AvatarUrl);
            var normalizedCurrentAvatarUrl = NormalizeOptional(currentAvatarUrl);

            if (isCreate || !string.Equals(normalizedAvatarUrl, normalizedCurrentAvatarUrl, StringComparison.Ordinal))
            {
                SupportedAvatars.Validate(normalizedAvatarUrl, "AvatarUrl", _configuration);
            }

            var hasNative = !string.IsNullOrWhiteSpace(request.NativeLanguageCode);
            var hasTarget = !string.IsNullOrWhiteSpace(request.TargetLanguageCode);

            if (hasNative)
            {
                SupportedLanguages.ValidateNative(request.NativeLanguageCode, "NativeLanguageCode");
            }

            if (hasTarget)
            {
                SupportedLanguages.ValidateLearnable(request.TargetLanguageCode, "TargetLanguageCode");
            }

            if (hasNative && hasTarget)
            {
                var native = SupportedLanguages.Normalize(request.NativeLanguageCode);
                var target = SupportedLanguages.Normalize(request.TargetLanguageCode);

                if (native == target)
                {
                    throw new ArgumentException("NativeLanguageCode and TargetLanguageCode must be different");
                }
            }

            if (!string.IsNullOrWhiteSpace(request.Theme))
            {
                var theme = request.Theme.Trim().ToLowerInvariant();

                if (theme != "light" && theme != "dark")
                {
                    throw new ArgumentException("Theme is invalid");
                }
            }

            var role = ParseRole(request.Role);
            var heartsMax = GetHeartsMax();

            if (role != Role.Admin && request.Hearts.HasValue && request.Hearts.Value > heartsMax)
            {
                throw new ArgumentException($"Hearts must be between 0 and {heartsMax}");
            }
        }

        private void EnsureUniqueUser(string email, string? username, int ignoreUserId)
        {
            var emailExists = _dbContext.Users.Any(x => x.Email == email && x.Id != ignoreUserId);

            if (emailExists)
            {
                throw new ConflictException("Користувач з таким email уже існує.");
            }

            if (!string.IsNullOrWhiteSpace(username))
            {
                var usernameExists = _dbContext.Users.Any(x => x.Username == username && x.Id != ignoreUserId);

                if (usernameExists)
                {
                    throw new ConflictException("Користувач з таким username уже існує.");
                }
            }
        }

        private void ValidateCourseSelection(List<int> courseIds, int? activeCourseId)
        {
            if (activeCourseId.HasValue && activeCourseId.Value > 0 && !courseIds.Contains(activeCourseId.Value))
            {
                throw new ArgumentException("ActiveCourseId must be included in CourseIds");
            }

            if (courseIds.Count == 0)
            {
                return;
            }

            var existingCourseIds = _dbContext.Courses
                .Where(x => courseIds.Contains(x.Id))
                .Select(x => x.Id)
                .ToList();

            if (existingCourseIds.Count != courseIds.Count)
            {
                throw new KeyNotFoundException("Один або кілька курсів не знайдено.");
            }
        }

        private (string? NativeLanguageCode, string? TargetLanguageCode) NormalizeLanguages(string? nativeLanguageCode, string? targetLanguageCode, List<int> courseIds, int? activeCourseId)
        {
            string? normalizedNative = string.IsNullOrWhiteSpace(nativeLanguageCode)
                ? null
                : SupportedLanguages.Normalize(nativeLanguageCode);

            string? normalizedTarget = string.IsNullOrWhiteSpace(targetLanguageCode)
                ? null
                : SupportedLanguages.Normalize(targetLanguageCode);

            if (courseIds.Count > 0)
            {
                var courseLookup = _dbContext.Courses
                    .Where(x => courseIds.Contains(x.Id))
                    .Select(x => new { x.Id, x.LanguageCode })
                    .ToList();

                var selectedActiveCourseId = activeCourseId.HasValue && activeCourseId.Value > 0
                    ? activeCourseId.Value
                    : courseLookup.Select(x => x.Id).FirstOrDefault();

                var activeCourse = courseLookup.FirstOrDefault(x => x.Id == selectedActiveCourseId) ?? courseLookup.FirstOrDefault();

                if (activeCourse != null)
                {
                    normalizedTarget = SupportedLanguages.Normalize(activeCourse.LanguageCode);
                }
            }

            if (!string.IsNullOrWhiteSpace(normalizedTarget) && string.IsNullOrWhiteSpace(normalizedNative))
            {
                normalizedNative = SupportedLanguages.DefaultNativeLanguageCode;
            }

            if (!string.IsNullOrWhiteSpace(normalizedNative) && !string.IsNullOrWhiteSpace(normalizedTarget) && normalizedNative == normalizedTarget)
            {
                throw new ArgumentException("NativeLanguageCode and TargetLanguageCode must be different");
            }

            return (normalizedNative, normalizedTarget);
        }

        private void SyncUserProgress(int userId, int points)
        {
            var normalizedPoints = Math.Max(0, points);
            var progress = _dbContext.UserProgresses.FirstOrDefault(x => x.UserId == userId);

            if (progress == null)
            {
                _dbContext.UserProgresses.Add(new UserProgress
                {
                    UserId = userId,
                    CompletedLessons = 0,
                    TotalScore = normalizedPoints,
                    LastUpdatedAt = DateTime.UtcNow,
                });
            }
            else
            {
                progress.TotalScore = normalizedPoints;
                progress.LastUpdatedAt = DateTime.UtcNow;
            }

            _dbContext.SaveChanges();
        }

        private void SyncUserCourses(User user, List<int> courseIds, int? activeCourseId, string? fallbackTargetLanguageCode)
        {
            var existing = _dbContext.UserCourses.Where(x => x.UserId == user.Id).ToList();
            var normalizedCourseIds = NormalizeCourseIds(courseIds);
            var removeList = existing.Where(x => !normalizedCourseIds.Contains(x.CourseId)).ToList();

            if (removeList.Count > 0)
            {
                _dbContext.UserCourses.RemoveRange(removeList);
            }

            var remaining = existing.Where(x => normalizedCourseIds.Contains(x.CourseId)).ToList();
            var now = DateTime.UtcNow;

            foreach (var courseId in normalizedCourseIds)
            {
                if (remaining.Any(x => x.CourseId == courseId))
                {
                    continue;
                }

                var item = new UserCourse
                {
                    UserId = user.Id,
                    CourseId = courseId,
                    IsActive = false,
                    IsCompleted = false,
                    StartedAt = now,
                    LastOpenedAt = now,
                };

                _dbContext.UserCourses.Add(item);
                remaining.Add(item);
            }

            foreach (var item in remaining)
            {
                item.IsActive = false;
            }

            var selectedActiveCourse = activeCourseId.HasValue && activeCourseId.Value > 0
                ? remaining.FirstOrDefault(x => x.CourseId == activeCourseId.Value)
                : null;

            if (selectedActiveCourse == null && !string.IsNullOrWhiteSpace(fallbackTargetLanguageCode))
            {
                var normalizedTarget = SupportedLanguages.Normalize(fallbackTargetLanguageCode);
                var courseIdsByLanguage = _dbContext.Courses
                    .Where(x => normalizedCourseIds.Contains(x.Id) && x.LanguageCode == normalizedTarget)
                    .Select(x => x.Id)
                    .ToList();

                selectedActiveCourse = remaining.FirstOrDefault(x => courseIdsByLanguage.Contains(x.CourseId));
            }

            selectedActiveCourse ??= remaining.OrderBy(x => x.CourseId).FirstOrDefault();

            if (selectedActiveCourse != null)
            {
                selectedActiveCourse.IsActive = true;
                selectedActiveCourse.LastOpenedAt = now;

                var activeCourseLanguage = _dbContext.Courses
                    .Where(x => x.Id == selectedActiveCourse.CourseId)
                    .Select(x => x.LanguageCode)
                    .FirstOrDefault();

                if (!string.IsNullOrWhiteSpace(activeCourseLanguage))
                {
                    user.TargetLanguageCode = SupportedLanguages.Normalize(activeCourseLanguage);

                    if (string.IsNullOrWhiteSpace(user.NativeLanguageCode))
                    {
                        user.NativeLanguageCode = SupportedLanguages.DefaultNativeLanguageCode;
                    }
                }
            }

            _dbContext.SaveChanges();
        }

        private static string NormalizeRequiredEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                throw new ArgumentException("Email is required");
            }

            return email.Trim();
        }

        private static string? NormalizeUsername(string? username)
        {
            var value = string.IsNullOrWhiteSpace(username) ? null : username.Trim();
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }

        private static string? NormalizeOptional(string? value)
        {
            var normalized = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private static string NormalizeTheme(string? theme)
        {
            return string.IsNullOrWhiteSpace(theme) ? "light" : theme.Trim().ToLowerInvariant();
        }

        private static List<int> NormalizeCourseIds(IEnumerable<int>? courseIds)
        {
            return (courseIds ?? Array.Empty<int>())
                .Where(x => x > 0)
                .Distinct()
                .OrderBy(x => x)
                .ToList();
        }

        private AdminUserUpsertRequest BuildEffectiveUpdateRequest(
            AdminUserUpsertRequest request,
            User user,
            int currentPoints,
            List<int> currentCourseIds,
            int? currentActiveCourseId)
        {
            return new AdminUserUpsertRequest
            {
                Username = request.HasField(nameof(AdminUserUpsertRequest.Username)) ? request.Username : user.Username,
                Email = request.HasField(nameof(AdminUserUpsertRequest.Email)) ? request.Email : user.Email,
                Password = request.HasField(nameof(AdminUserUpsertRequest.Password)) ? request.Password : null,
                AvatarUrl = request.HasField(nameof(AdminUserUpsertRequest.AvatarUrl)) ? request.AvatarUrl : user.AvatarUrl,
                NativeLanguageCode = request.HasField(nameof(AdminUserUpsertRequest.NativeLanguageCode)) ? request.NativeLanguageCode : user.NativeLanguageCode,
                TargetLanguageCode = request.HasField(nameof(AdminUserUpsertRequest.TargetLanguageCode)) ? request.TargetLanguageCode : user.TargetLanguageCode,
                Role = request.HasField(nameof(AdminUserUpsertRequest.Role)) ? request.Role : user.Role.ToString(),
                IsEmailVerified = request.HasField(nameof(AdminUserUpsertRequest.IsEmailVerified)) ? request.IsEmailVerified : user.IsEmailVerified,
                Hearts = request.HasField(nameof(AdminUserUpsertRequest.Hearts)) ? request.Hearts : user.Hearts,
                Crystals = request.HasField(nameof(AdminUserUpsertRequest.Crystals)) ? request.Crystals : user.Crystals,
                Points = request.HasField(nameof(AdminUserUpsertRequest.Points)) ? request.Points : currentPoints,
                BlockedUntilUtc = request.HasField(nameof(AdminUserUpsertRequest.BlockedUntilUtc)) ? request.BlockedUntilUtc : user.BlockedUntilUtc,
                Theme = request.HasField(nameof(AdminUserUpsertRequest.Theme)) ? request.Theme : user.Theme,
                CourseIds = request.HasField(nameof(AdminUserUpsertRequest.CourseIds)) ? (request.CourseIds ?? new List<int>()) : currentCourseIds,
                ActiveCourseId = request.HasField(nameof(AdminUserUpsertRequest.ActiveCourseId)) ? request.ActiveCourseId : currentActiveCourseId,
            };
        }

        private int GetHeartsMax()
        {
            var heartsMax = _configuration.GetValue<int?>("Learning:HeartsMax") ?? 5;
            return heartsMax <= 0 ? 5 : heartsMax;
        }

        private int NormalizeHearts(int? hearts)
        {
            var heartsMax = GetHeartsMax();
            return Math.Clamp(hearts ?? heartsMax, 0, heartsMax);
        }

        private static Role ParseRole(string? role)
        {
            if (Enum.TryParse<Role>(string.IsNullOrWhiteSpace(role) ? "User" : role.Trim(), true, out var parsedRole))
            {
                return parsedRole;
            }

            throw new ArgumentException("Role is invalid");
        }

        private void InvalidateUserSessions(int userId)
        {
            var activeTokens = _dbContext.RefreshTokens
                .Where(x => x.UserId == userId && x.RevokedAt == null)
                .ToList();

            var user = _dbContext.Users.FirstOrDefault(x => x.Id == userId);
            if (user == null)
            {
                return;
            }

            var now = DateTime.UtcNow;

            foreach (var token in activeTokens)
            {
                token.RevokedAt = now;
            }

            user.SessionVersion++;
            _dbContext.SaveChanges();
        }

        private static DateTime? NormalizeBlockedUntilUtc(DateTime? blockedUntilUtc)
        {
            if (!blockedUntilUtc.HasValue)
            {
                return null;
            }

            var value = blockedUntilUtc.Value;

            if (value.Kind == DateTimeKind.Unspecified)
            {
                value = DateTime.SpecifyKind(value, DateTimeKind.Utc);
            }
            else if (value.Kind == DateTimeKind.Local)
            {
                value = value.ToUniversalTime();
            }

            return value > DateTime.UtcNow ? value : null;
        }

        private static bool IsPrimaryAdminEmail(string? email)
        {
            return string.Equals(email?.Trim(), PrimaryAdminEmail, StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsPrimaryAdmin(User user)
        {
            return IsPrimaryAdminEmail(user.Email);
        }

        private static bool IsUserBlocked(User user)
        {
            return NormalizeBlockedUntilUtc(user.BlockedUntilUtc).HasValue;
        }
    }
}
