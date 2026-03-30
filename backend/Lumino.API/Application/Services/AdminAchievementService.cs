using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;

namespace Lumino.Api.Application.Services
{
    public class AdminAchievementService : IAdminAchievementService
    {
        private const string SystemPrefix = "sys.";

        private readonly LuminoDbContext _dbContext;

        public AdminAchievementService(LuminoDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public List<AdminAchievementResponse> GetAll()
        {
            var list = _dbContext.Achievements
                .OrderBy(x => x.Id)
                .Select(x => new AdminAchievementResponse
                {
                    Id = x.Id,
                    Code = x.Code,
                    Title = x.Title,
                    Description = x.Description,
                    IsSystem = IsSystemAchievement(x.Code),
                    CanEditDescription = !IsSystemAchievement(x.Code),
                    ImageUrl = x.ImageUrl
                })
                .ToList();

            return list;
        }

        public AdminAchievementResponse GetById(int id)
        {
            var a = _dbContext.Achievements.FirstOrDefault(x => x.Id == id);

            if (a == null)
            {
                throw new KeyNotFoundException("Achievement not found");
            }

            return new AdminAchievementResponse
            {
                Id = a.Id,
                Code = a.Code,
                Title = a.Title,
                Description = a.Description,
                IsSystem = IsSystemAchievement(a.Code),
                CanEditDescription = !IsSystemAchievement(a.Code),
                ImageUrl = a.ImageUrl
            };
        }

        public AdminAchievementResponse Create(CreateAchievementRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                throw new ArgumentException("Title is required");
            }

            if (string.IsNullOrWhiteSpace(request.Description))
            {
                throw new ArgumentException("Description is required");
            }

            string code = BuildCode(request.Code);

            bool codeExists = _dbContext.Achievements.Any(x => x.Code == code);

            if (codeExists)
            {
                throw new ArgumentException("Achievement code already exists");
            }

            var a = new Achievement
            {
                Code = code,
                Title = request.Title.Trim(),
                Description = request.Description.Trim(),
                ImageUrl = NormalizeImageUrl(request.ImageUrl)
            };

            _dbContext.Achievements.Add(a);
            _dbContext.SaveChanges();

            return GetById(a.Id);
        }

        public void Update(int id, UpdateAchievementRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var a = _dbContext.Achievements.FirstOrDefault(x => x.Id == id);

            if (a == null)
            {
                throw new KeyNotFoundException("Achievement not found");
            }

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                throw new ArgumentException("Title is required");
            }

            bool isSystem = IsSystemAchievement(a.Code);

            if (!isSystem && string.IsNullOrWhiteSpace(request.Description))
            {
                throw new ArgumentException("Description is required");
            }

            a.Title = request.Title.Trim();

            if (!isSystem)
            {
                a.Description = request.Description!.Trim();
            }

            a.ImageUrl = NormalizeImageUrl(request.ImageUrl);

            _dbContext.SaveChanges();
        }

        public void Delete(int id)
        {
            var a = _dbContext.Achievements.FirstOrDefault(x => x.Id == id);

            if (a == null)
            {
                throw new KeyNotFoundException("Achievement not found");
            }

            if (IsSystemAchievement(a.Code))
            {
                throw new ArgumentException("System achievement cannot be deleted");
            }

            _dbContext.Achievements.Remove(a);
            _dbContext.SaveChanges();
        }

        private static bool IsSystemAchievement(string code)
        {
            return !string.IsNullOrWhiteSpace(code)
                && code.StartsWith(SystemPrefix, StringComparison.OrdinalIgnoreCase);
        }

        private static string? NormalizeImageUrl(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                return null;
            }

            string value = imageUrl.Trim().Replace("\\", "/");

            if (value.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("data:", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("blob:", StringComparison.OrdinalIgnoreCase))
            {
                return value;
            }

            if (value.StartsWith("/"))
            {
                return value;
            }

            if (value.StartsWith("uploads/achievements/", StringComparison.OrdinalIgnoreCase))
            {
                return $"/{value}";
            }

            if (value.Contains("/") || value.Contains(".."))
            {
                return $"/{value.TrimStart('/')}";
            }

            return $"/uploads/achievements/{value}";
        }

        private static string BuildCode(string? input)
        {
            if (!string.IsNullOrWhiteSpace(input))
            {
                return input.Trim();
            }

            return $"custom.{Guid.NewGuid():N}";
        }
    }
}
