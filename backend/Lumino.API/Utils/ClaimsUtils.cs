using System.Security.Claims;

namespace Lumino.Api.Utils
{
    public static class ClaimsUtils
    {
        public const string SessionVersionClaimType = "session_version";

        public static int GetUserIdOrThrow(ClaimsPrincipal user)
        {
            var id = user.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? user.FindFirstValue(ClaimTypes.Name)
                ?? user.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(id) || !int.TryParse(id, out int userId) || userId <= 0)
            {
                throw new UnauthorizedAccessException("Invalid token");
            }

            return userId;
        }

        public static int GetSessionVersionOrThrow(ClaimsPrincipal user)
        {
            var value = user.FindFirstValue(SessionVersionClaimType);

            if (string.IsNullOrWhiteSpace(value) || !int.TryParse(value, out var sessionVersion) || sessionVersion < 0)
            {
                throw new UnauthorizedAccessException("Invalid session");
            }

            return sessionVersion;
        }

        public static string GetRoleOrEmpty(ClaimsPrincipal user)
        {
            return user.FindFirstValue(ClaimTypes.Role)?.Trim() ?? string.Empty;
        }
    }
}
