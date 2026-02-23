using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;

namespace Lumino.Api.Application.Services
{
    public class AdminCourseService : IAdminCourseService
    {
        private readonly LuminoDbContext _dbContext;

        public AdminCourseService(LuminoDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public List<AdminCourseResponse> GetAll()
        {
            return _dbContext.Courses
                .Select(x => new AdminCourseResponse
                {
                    Id = x.Id,
                    Title = x.Title,
                    Description = x.Description,
                    LanguageCode = x.LanguageCode,
                    IsPublished = x.IsPublished
                })
                .ToList();
        }

        public AdminCourseResponse Create(CreateCourseRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var languageCode = string.IsNullOrWhiteSpace(request.LanguageCode)
                ? "en"
                : request.LanguageCode.Trim().ToLowerInvariant();

            if (!SupportedLanguages.IsLearnable(languageCode))
            {
                throw new ArgumentException("LanguageCode is not supported");
            }

            var course = new Course
            {
                Title = request.Title,
                Description = request.Description,
                LanguageCode = languageCode,
                IsPublished = request.IsPublished
            };

            _dbContext.Courses.Add(course);
            _dbContext.SaveChanges();

            return new AdminCourseResponse
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                LanguageCode = course.LanguageCode,
                IsPublished = course.IsPublished
            };
        }

        public void Update(int id, UpdateCourseRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request is required");
            }

            var course = _dbContext.Courses.FirstOrDefault(x => x.Id == id);

            if (course == null)
            {
                throw new KeyNotFoundException("Course not found");
            }

            var languageCode = string.IsNullOrWhiteSpace(request.LanguageCode)
                ? "en"
                : request.LanguageCode.Trim().ToLowerInvariant();

            if (!SupportedLanguages.IsLearnable(languageCode))
            {
                throw new ArgumentException("LanguageCode is not supported");
            }

            course.Title = request.Title;
            course.Description = request.Description;
            course.LanguageCode = languageCode;
            course.IsPublished = request.IsPublished;

            _dbContext.SaveChanges();
        }

        public void Delete(int id)
        {
            var course = _dbContext.Courses.FirstOrDefault(x => x.Id == id);

            if (course == null)
            {
                throw new KeyNotFoundException("Course not found");
            }

            _dbContext.Courses.Remove(course);
            _dbContext.SaveChanges();
        }
    }
}
