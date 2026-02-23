using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;

namespace Lumino.Api.Application.Services
{
    public class CourseService : ICourseService
    {
        private readonly LuminoDbContext _dbContext;

        public CourseService(LuminoDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public List<CourseResponse> GetPublishedCourses(string? languageCode = null)
        {
            var query = _dbContext.Courses
                .Where(x => x.IsPublished);

            if (!string.IsNullOrWhiteSpace(languageCode))
            {
                if (!Lumino.Api.Utils.SupportedLanguages.IsLearnable(languageCode))
                {
                    throw new ArgumentException("LanguageCode is not supported");
                }

                var normalized = languageCode.Trim().ToLowerInvariant();
                query = query.Where(x => x.LanguageCode == normalized);
            }

            return query
                .Select(x => new CourseResponse
                {
                    Id = x.Id,
                    Title = x.Title,
                    Description = x.Description,
                    LanguageCode = x.LanguageCode
                })
                .ToList();
        }
    }
}
