using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
using Lumino.Api.Utils;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
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

        private static readonly string[] AllowedExtensions = new[]
        {
            ".png", ".jpg", ".jpeg", ".gif", ".webp",
            ".mp3", ".wav", ".ogg",
            ".glb", ".gltf",
            ".json"
        };

        public MediaService(IWebHostEnvironment environment)
        {
            _environment = environment;
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

            var files = filePaths
                .Select(path => new FileInfo(path))
                .OrderByDescending(x => x.LastWriteTimeUtc)
                .Skip(skip)
                .Take(take)
                .Select(x => BuildMediaFileResponse(x, uploadsPath, baseUrl))
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

            return BuildMediaFileResponse(fileInfo, uploadsPath, baseUrl);
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

        private static MediaFileResponse BuildMediaFileResponse(FileInfo fileInfo, string uploadsPath, string baseUrl)
        {
            var relativePath = Path.GetRelativePath(uploadsPath, fileInfo.FullName)
                .Replace('\\', '/');

            return new MediaFileResponse
            {
                FileName = relativePath,
                Url = $"{baseUrl}/uploads/{relativePath}",
                SizeBytes = fileInfo.Length,
                LastModifiedUtc = fileInfo.LastWriteTimeUtc,
                Extension = fileInfo.Extension
            };
        }
    }
}
