namespace Lumino.Api.Application.DTOs
{
    public class AdminRefreshTokenResponse
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string? Username { get; set; }

        public string Email { get; set; } = null!;

        public string Role { get; set; } = null!;

        public string TokenHash { get; set; } = null!;

        public DateTime CreatedAt { get; set; }

        public DateTime ExpiresAt { get; set; }

        public DateTime? RevokedAt { get; set; }

        public string? ReplacedByTokenHash { get; set; }

        public bool IsExpired { get; set; }

        public bool IsRevoked { get; set; }

        public bool IsActive { get; set; }
    }
}
