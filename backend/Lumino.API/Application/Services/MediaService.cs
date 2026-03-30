using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;
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
                .Select(x =>
                {
                    var relativePath = Path.GetRelativePath(uploadsPath, x.FullName)
                        .Replace('\\', '/');

                    return new MediaFileResponse
                    {
                        FileName = relativePath,
                        Url = $"{baseUrl}/uploads/{relativePath}",
                        SizeBytes = x.Length,
                        LastModifiedUtc = x.LastWriteTimeUtc,
                        Extension = x.Extension
                    };
                })
                .ToList();

            return files;
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
    }
}
