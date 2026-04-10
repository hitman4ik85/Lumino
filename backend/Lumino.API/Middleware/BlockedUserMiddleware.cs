using Lumino.Api.Data;
using Lumino.Api.Domain.Enums;
using Lumino.Api.Utils;
using Microsoft.EntityFrameworkCore;

namespace Lumino.Api.Middleware
{
    public class BlockedUserMiddleware
    {
        private readonly RequestDelegate _next;

        public BlockedUserMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context, LuminoDbContext dbContext)
        {
            if (!(context.User?.Identity?.IsAuthenticated ?? false))
            {
                await _next(context);
                return;
            }

            var userId = ClaimsUtils.GetUserIdOrThrow(context.User);
            var tokenSessionVersion = ClaimsUtils.GetSessionVersionOrThrow(context.User);
            var tokenRole = ClaimsUtils.GetRoleOrEmpty(context.User);

            var user = dbContext.Users
                .AsNoTracking()
                .Where(x => x.Id == userId)
                .Select(x => new
                {
                    x.Role,
                    x.BlockedUntilUtc,
                    x.SessionVersion
                })
                .FirstOrDefault();

            if (user == null)
            {
                throw new UnauthorizedAccessException("User not found");
            }

            if (user.SessionVersion != tokenSessionVersion)
            {
                throw new UnauthorizedAccessException("Session expired");
            }

            var effectiveRole = Enum.IsDefined(typeof(Role), user.Role)
                ? user.Role
                : Role.User;

            if (!string.Equals(tokenRole, effectiveRole.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Session role mismatch");
            }

            var blockedUntilUtc = user.BlockedUntilUtc;

            if (blockedUntilUtc.HasValue)
            {
                var value = blockedUntilUtc.Value;

                if (value.Kind == DateTimeKind.Local)
                {
                    value = value.ToUniversalTime();
                }
                else if (value.Kind == DateTimeKind.Unspecified)
                {
                    value = DateTime.SpecifyKind(value, DateTimeKind.Utc);
                }

                if (value > DateTime.UtcNow)
                {
                    throw new ForbiddenAccessException($"Користувача заблоковано до {value:yyyy-MM-dd HH:mm} UTC.");
                }
            }

            await _next(context);
        }
    }
}
