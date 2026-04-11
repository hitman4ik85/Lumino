using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Data;
using Lumino.Api.Utils;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Lumino.Api.Application.Services
{
    public class MediaService : IMediaService
    {
        private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB
        private readonly IWebHostEnvironment _environment;
        private readonly LuminoDbContext _db;

        private static readonly string[] AllowedExtensions = new[]
        {
            ".png", ".jpg", ".jpeg", ".gif", ".webp",
            ".mp3", ".wav", ".ogg",
            ".glb", ".gltf",
            ".json"
        };

        public MediaService(IWebHostEnvironment environment, LuminoDbContext db)
        {
            _environment = environment;
            _db = db;
        }

        public UploadMediaResponse Upload(IFormFile file, string baseUrl, string? folder = null)
        {
            if (file == null)
            {
                throw new ArgumentException("File is required");
            }

            if (file.Length <= 0)
            {
                throw new ArgumentException("File is empty");
            }

            if (file.Length > MaxFileSizeBytes)
            {
                throw new ArgumentException("File is too large");
            }

            var ext = Path.GetExtension(file.FileName).ToLower();

            if (string.IsNullOrWhiteSpace(ext) || !AllowedExtensions.Contains(ext))
            {
                throw new ArgumentException("File format is not allowed");
            }

            var uploadsPath = BuildUploadsPath(folder);

            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            var storedFileName = $"{Guid.NewGuid()}{ext}";
            var fullPath = Path.Combine(uploadsPath, storedFileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                file.CopyTo(stream);
            }

            var relativeFolder = BuildRelativeFolder(folder);
            var relativePath = string.IsNullOrWhiteSpace(relativeFolder)
                ? $"/uploads/{storedFileName}"
                : $"/uploads/{relativeFolder}/{storedFileName}";

            return new UploadMediaResponse
            {
                Url = $"{baseUrl}{relativePath}",
                ContentType = file.ContentType,
                FileName = storedFileName
            };
        }

        public List<MediaFileResponse> List(string baseUrl, string? query = null, int skip = 0, int take = 100)
        {
            var uploadsPath = Path.Combine(ResolveWebRootPath(), "uploads");

            if (!Directory.Exists(uploadsPath))
            {
                return new List<MediaFileResponse>();
            }

            IEnumerable<string> filePaths = Directory.GetFiles(uploadsPath, "*", SearchOption.AllDirectories);

            if (!string.IsNullOrWhiteSpace(query))
            {
                var q = query.Trim();

                filePaths = filePaths
                    .Where(path =>
                    {
                        var relativePath = Path.GetRelativePath(uploadsPath, path)
                            .Replace('\\', '/');

                        return relativePath.Contains(q, StringComparison.OrdinalIgnoreCase);
                    });
            }

            if (skip < 0)
            {
                skip = 0;
            }

            if (take <= 0)
            {
                take = 100;
            }

            var fileInfos = filePaths
                .Select(path => new FileInfo(path))
                .OrderByDescending(x => x.LastWriteTimeUtc)
                .Skip(skip)
                .Take(take)
                .ToList();

            var bindingsByRelativePath = BuildBindingsByRelativePath(fileInfos, uploadsPath);

            var files = fileInfos
                .Select(x =>
                {
                    var relativePath = GetUploadsRelativePath(x, uploadsPath);
                    bindingsByRelativePath.TryGetValue(relativePath, out var bindings);

                    return BuildMediaFileResponse(x, uploadsPath, baseUrl, bindings);
                })
                .ToList();

            return files;
        }

        public void Delete(string path)
        {
            var relativePath = NormalizeRelativePath(path);
            var fullPath = ResolveMediaFilePath(relativePath);

            if (!File.Exists(fullPath))
            {
                throw new KeyNotFoundException("Файл не знайдено");
            }

            File.Delete(fullPath);
        }

        public MediaFileResponse Rename(string path, string newFileName, string baseUrl)
        {
            var relativePath = NormalizeRelativePath(path);
            var fullPath = ResolveMediaFilePath(relativePath);

            if (!File.Exists(fullPath))
            {
                throw new KeyNotFoundException("Файл не знайдено");
            }

            var currentExtension = Path.GetExtension(fullPath);
            var normalizedFileName = NormalizeTargetFileName(newFileName, currentExtension);
            var currentDirectory = Path.GetDirectoryName(fullPath) ?? Path.Combine(ResolveWebRootPath(), "uploads");
            var targetFullPath = Path.Combine(currentDirectory, normalizedFileName);

            if (!string.Equals(fullPath, targetFullPath, StringComparison.OrdinalIgnoreCase) && File.Exists(targetFullPath))
            {
                throw new ConflictException("Файл з такою назвою вже існує");
            }

            if (!string.Equals(fullPath, targetFullPath, StringComparison.OrdinalIgnoreCase))
            {
                File.Move(fullPath, targetFullPath);
            }

            var uploadsPath = Path.Combine(ResolveWebRootPath(), "uploads");
            var fileInfo = new FileInfo(targetFullPath);
            var bindingsByRelativePath = BuildBindingsByRelativePath(new[] { fileInfo }, uploadsPath);
            bindingsByRelativePath.TryGetValue(GetUploadsRelativePath(fileInfo, uploadsPath), out var bindings);

            return BuildMediaFileResponse(fileInfo, uploadsPath, baseUrl, bindings);
        }

        private string BuildUploadsPath(string? folder)
        {
            var uploadsRoot = Path.Combine(ResolveWebRootPath(), "uploads");
            var relativeFolder = BuildRelativeFolder(folder);

            if (string.IsNullOrWhiteSpace(relativeFolder))
            {
                return uploadsRoot;
            }

            var parts = relativeFolder
                .Split('/', StringSplitOptions.RemoveEmptyEntries);

            return parts.Aggregate(uploadsRoot, Path.Combine);
        }

        private string ResolveWebRootPath()
        {
            if (!string.IsNullOrWhiteSpace(_environment.WebRootPath))
            {
                return _environment.WebRootPath;
            }

            if (!string.IsNullOrWhiteSpace(_environment.ContentRootPath))
            {
                return Path.Combine(_environment.ContentRootPath, "wwwroot");
            }

            return Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        private static string BuildRelativeFolder(string? folder)
        {
            if (string.IsNullOrWhiteSpace(folder))
            {
                return string.Empty;
            }

            var normalized = folder
                .Replace('\\', '/')
                .Trim('/');

            if (string.IsNullOrWhiteSpace(normalized))
            {
                return string.Empty;
            }

            var segments = normalized
                .Split('/', StringSplitOptions.RemoveEmptyEntries)
                .Where(x => x != "." && x != "..")
                .ToArray();

            return string.Join('/', segments);
        }

        private string ResolveMediaFilePath(string relativePath)
        {
            var uploadsPath = Path.GetFullPath(Path.Combine(ResolveWebRootPath(), "uploads"));
            var segments = relativePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            var combinedPath = segments.Aggregate(uploadsPath, Path.Combine);
            var fullPath = Path.GetFullPath(combinedPath);
            var uploadsPathWithSeparator = uploadsPath.EndsWith(Path.DirectorySeparatorChar)
                ? uploadsPath
                : uploadsPath + Path.DirectorySeparatorChar;

            if (!fullPath.Equals(uploadsPath, StringComparison.OrdinalIgnoreCase)
                && !fullPath.StartsWith(uploadsPathWithSeparator, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Некоректний шлях до файлу");
            }

            return fullPath;
        }

        private static string NormalizeRelativePath(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
            {
                throw new ArgumentException("Шлях до файлу обов'язковий");
            }

            var normalized = path
                .Replace('\\', '/')
                .Trim();

            normalized = normalized.TrimStart('/');

            if (normalized.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
            {
                normalized = normalized.Substring("uploads/".Length);
            }

            normalized = normalized.Trim('/');

            if (string.IsNullOrWhiteSpace(normalized))
            {
                throw new ArgumentException("Шлях до файлу обов'язковий");
            }

            var segments = normalized
                .Split('/', StringSplitOptions.RemoveEmptyEntries)
                .ToArray();

            if (segments.Length == 0 || segments.Any(x => x == "." || x == ".."))
            {
                throw new ArgumentException("Некоректний шлях до файлу");
            }

            return string.Join('/', segments);
        }

        private static string NormalizeTargetFileName(string newFileName, string currentExtension)
        {
            if (string.IsNullOrWhiteSpace(newFileName))
            {
                throw new ArgumentException("Вкажіть нову назву файлу");
            }

            var trimmed = newFileName.Trim();

            if (trimmed.Contains('/') || trimmed.Contains('\\'))
            {
                throw new ArgumentException("Назва файлу не повинна містити шлях");
            }

            var onlyFileName = Path.GetFileName(trimmed);

            if (string.IsNullOrWhiteSpace(onlyFileName))
            {
                throw new ArgumentException("Вкажіть нову назву файлу");
            }

            if (onlyFileName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
            {
                throw new ArgumentException("Назва файлу містить недопустимі символи");
            }

            var baseName = Path.GetFileNameWithoutExtension(onlyFileName).Trim();

            if (string.IsNullOrWhiteSpace(baseName))
            {
                throw new ArgumentException("Вкажіть коректну назву файлу");
            }

            var requestedExtension = Path.GetExtension(onlyFileName);

            if (!string.IsNullOrWhiteSpace(requestedExtension) && !string.Equals(requestedExtension, currentExtension, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Не можна змінювати розширення файлу");
            }

            return $"{baseName}{currentExtension}";
        }

        private Dictionary<string, List<string>> BuildBindingsByRelativePath(IEnumerable<FileInfo> files, string uploadsPath)
        {
            var targetRelativePaths = files
                .Select(fileInfo => GetUploadsRelativePath(fileInfo, uploadsPath))
                .Where(path => !string.IsNullOrWhiteSpace(path))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var result = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

            if (targetRelativePaths.Count == 0)
            {
                return result;
            }

            AddExerciseBindings(result, targetRelativePaths);
            AddSceneBindings(result, targetRelativePaths);
            AddAchievementBindings(result, targetRelativePaths);
            AddUserAvatarBindings(result, targetRelativePaths);

            return result;
        }

        private void AddExerciseBindings(Dictionary<string, List<string>> result, HashSet<string> targetRelativePaths)
        {
            var items = (
                from exercise in _db.Exercises.AsNoTracking()
                join lesson in _db.Lessons.AsNoTracking() on exercise.LessonId equals lesson.Id
                join topic in _db.Topics.AsNoTracking() on lesson.TopicId equals topic.Id
                join course in _db.Courses.AsNoTracking() on topic.CourseId equals course.Id
                where exercise.ImageUrl != null
                select new
                {
                    exercise.ImageUrl,
                    exercise.Order,
                    LessonTitle = lesson.Title,
                    TopicTitle = topic.Title,
                    CourseTitle = course.Title,
                })
                .ToList();

            foreach (var item in items)
            {
                var relativePath = TryNormalizeUploadsRelativePath(item.ImageUrl);

                if (string.IsNullOrWhiteSpace(relativePath) || !targetRelativePaths.Contains(relativePath))
                {
                    continue;
                }

                AddBinding(result, relativePath, $"Вправа {item.Order} уроку \"{item.LessonTitle}\" теми \"{item.TopicTitle}\" курсу \"{item.CourseTitle}\"");
            }
        }

        private void AddSceneBindings(Dictionary<string, List<string>> result, HashSet<string> targetRelativePaths)
        {
            var sceneMediaItems = (
                from scene in _db.Scenes.AsNoTracking()
                join topic in _db.Topics.AsNoTracking() on scene.TopicId equals topic.Id into topicGroup
                from topic in topicGroup.DefaultIfEmpty()
                join course in _db.Courses.AsNoTracking() on scene.CourseId equals course.Id into courseGroup
                from course in courseGroup.DefaultIfEmpty()
                select new
                {
                    scene.Title,
                    TopicTitle = topic != null ? topic.Title : null,
                    CourseTitle = course != null ? course.Title : null,
                    scene.BackgroundUrl,
                    scene.AudioUrl,
                })
                .ToList();

            foreach (var item in sceneMediaItems)
            {
                var sceneLocation = BuildSceneLocation(item.CourseTitle, item.TopicTitle);
                var backgroundRelativePath = TryNormalizeUploadsRelativePath(item.BackgroundUrl);
                var audioRelativePath = TryNormalizeUploadsRelativePath(item.AudioUrl);

                if (!string.IsNullOrWhiteSpace(backgroundRelativePath) && targetRelativePaths.Contains(backgroundRelativePath))
                {
                    AddBinding(result, backgroundRelativePath, $"Фон сцени \"{item.Title}\"{sceneLocation}");
                }

                if (!string.IsNullOrWhiteSpace(audioRelativePath) && targetRelativePaths.Contains(audioRelativePath))
                {
                    AddBinding(result, audioRelativePath, $"Аудіо сцени \"{item.Title}\"{sceneLocation}");
                }
            }

            var sceneStepItems = (
                from step in _db.SceneSteps.AsNoTracking()
                join scene in _db.Scenes.AsNoTracking() on step.SceneId equals scene.Id
                join topic in _db.Topics.AsNoTracking() on scene.TopicId equals topic.Id into topicGroup
                from topic in topicGroup.DefaultIfEmpty()
                join course in _db.Courses.AsNoTracking() on scene.CourseId equals course.Id into courseGroup
                from course in courseGroup.DefaultIfEmpty()
                where step.MediaUrl != null
                select new
                {
                    step.MediaUrl,
                    step.Order,
                    SceneTitle = scene.Title,
                    TopicTitle = topic != null ? topic.Title : null,
                    CourseTitle = course != null ? course.Title : null,
                })
                .ToList();

            foreach (var item in sceneStepItems)
            {
                var relativePath = TryNormalizeUploadsRelativePath(item.MediaUrl);

                if (string.IsNullOrWhiteSpace(relativePath) || !targetRelativePaths.Contains(relativePath))
                {
                    continue;
                }

                AddBinding(result, relativePath, $"Крок {item.Order} сцени \"{item.SceneTitle}\"{BuildSceneLocation(item.CourseTitle, item.TopicTitle)}");
            }
        }

        private void AddAchievementBindings(Dictionary<string, List<string>> result, HashSet<string> targetRelativePaths)
        {
            var items = _db.Achievements.AsNoTracking()
                .Where(x => x.ImageUrl != null)
                .Select(x => new
                {
                    x.ImageUrl,
                    x.Title,
                })
                .ToList();

            foreach (var item in items)
            {
                var relativePath = TryNormalizeUploadsRelativePath(item.ImageUrl);

                if (string.IsNullOrWhiteSpace(relativePath) || !targetRelativePaths.Contains(relativePath))
                {
                    continue;
                }

                AddBinding(result, relativePath, $"Досягнення \"{item.Title}\"");
            }
        }

        private void AddUserAvatarBindings(Dictionary<string, List<string>> result, HashSet<string> targetRelativePaths)
        {
            var items = _db.Users.AsNoTracking()
                .Where(x => x.AvatarUrl != null)
                .Select(x => new
                {
                    x.AvatarUrl,
                    x.Email,
                    x.Username,
                })
                .ToList();

            foreach (var item in items)
            {
                var relativePath = TryNormalizeUploadsRelativePath(item.AvatarUrl);

                if (string.IsNullOrWhiteSpace(relativePath) || !targetRelativePaths.Contains(relativePath))
                {
                    continue;
                }

                var userTitle = !string.IsNullOrWhiteSpace(item.Username)
                    ? item.Username!
                    : item.Email;

                AddBinding(result, relativePath, $"Аватар користувача \"{userTitle}\"");
            }
        }

        private static void AddBinding(Dictionary<string, List<string>> result, string relativePath, string binding)
        {
            if (string.IsNullOrWhiteSpace(relativePath) || string.IsNullOrWhiteSpace(binding))
            {
                return;
            }

            if (!result.TryGetValue(relativePath, out var items))
            {
                items = new List<string>();
                result[relativePath] = items;
            }

            if (!items.Any(x => string.Equals(x, binding, StringComparison.Ordinal)))
            {
                items.Add(binding);
            }
        }

        private static string BuildSceneLocation(string? courseTitle, string? topicTitle)
        {
            if (!string.IsNullOrWhiteSpace(courseTitle) && !string.IsNullOrWhiteSpace(topicTitle))
            {
                return $" теми \"{topicTitle}\" курсу \"{courseTitle}\"";
            }

            if (!string.IsNullOrWhiteSpace(topicTitle))
            {
                return $" теми \"{topicTitle}\"";
            }

            if (!string.IsNullOrWhiteSpace(courseTitle))
            {
                return $" курсу \"{courseTitle}\"";
            }

            return string.Empty;
        }

        private static string? TryNormalizeUploadsRelativePath(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var normalized = value.Trim().Replace('\\', '/');

            if (normalized.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || normalized.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                if (!Uri.TryCreate(normalized, UriKind.Absolute, out var uri))
                {
                    return null;
                }

                normalized = uri.AbsolutePath;
            }

            if (normalized.StartsWith("data:", StringComparison.OrdinalIgnoreCase)
                || normalized.StartsWith("blob:", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var markerIndex = normalized.IndexOf("/uploads/", StringComparison.OrdinalIgnoreCase);

            if (markerIndex >= 0)
            {
                normalized = normalized.Substring(markerIndex + "/uploads/".Length);
            }
            else if (normalized.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
            {
                normalized = normalized.Substring("uploads/".Length);
            }
            else
            {
                normalized = normalized.TrimStart('/');
            }

            normalized = normalized.Trim('/');

            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private static string GetUploadsRelativePath(FileInfo fileInfo, string uploadsPath)
        {
            return Path.GetRelativePath(uploadsPath, fileInfo.FullName)
                .Replace('\\', '/');
        }

        private static MediaFileResponse BuildMediaFileResponse(FileInfo fileInfo, string uploadsPath, string baseUrl, List<string>? bindings)
        {
            var relativePath = GetUploadsRelativePath(fileInfo, uploadsPath);
            var normalizedBindings = bindings ?? new List<string>();

            return new MediaFileResponse
            {
                FileName = relativePath,
                Url = $"{baseUrl}/uploads/{relativePath}",
                SizeBytes = fileInfo.Length,
                LastModifiedUtc = fileInfo.LastWriteTimeUtc,
                Extension = fileInfo.Extension,
                Bindings = normalizedBindings,
                BindingCount = normalizedBindings.Count
            };
        }
    }
}
