using Microsoft.AspNetCore.Hosting;
using System.IO;

namespace Lumino.Api.Utils
{
    public static class MediaUrlResolver
    {
        public static string? ToAbsoluteUrl(string? baseUrl, string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return null;
            }

            string value = url.Trim();

            if (value.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("data:", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("blob:", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(baseUrl))
            {
                return value;
            }

            string normalizedBaseUrl = baseUrl.Trim().TrimEnd('/');

            if (value.StartsWith("/"))
            {
                return $"{normalizedBaseUrl}{value}";
            }

            return $"{normalizedBaseUrl}/{value.TrimStart('/')}";
        }



        public static string? ResolveLessonImageForClient(IWebHostEnvironment environment, string? baseUrl, string? imageUrl)
        {
            string? normalizedUrl = NormalizeLessonImageUrl(imageUrl);

            if (string.IsNullOrWhiteSpace(normalizedUrl))
            {
                return null;
            }

            if (normalizedUrl.StartsWith("data:", StringComparison.OrdinalIgnoreCase)
                || normalizedUrl.StartsWith("blob:", StringComparison.OrdinalIgnoreCase))
            {
                return normalizedUrl;
            }

            string? dataUrl = TryBuildLessonImageDataUrl(environment, normalizedUrl);

            if (!string.IsNullOrWhiteSpace(dataUrl))
            {
                return dataUrl;
            }

            return ToAbsoluteUrl(baseUrl, normalizedUrl);
        }

        public static string? NormalizeLessonImageUrl(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                return null;
            }

            string value = imageUrl.Trim().Replace('\\', '/');

            if (value.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("data:", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("blob:", StringComparison.OrdinalIgnoreCase))
            {
                return value;
            }

            string? extractedPublicPath = TryExtractPublicPath(value);

            if (!string.IsNullOrWhiteSpace(extractedPublicPath))
            {
                return extractedPublicPath;
            }

            if (value.StartsWith("/"))
            {
                return value;
            }

            if (value.StartsWith("uploads/lessons/", StringComparison.OrdinalIgnoreCase))
            {
                return $"/{value}";
            }

            if (value.Contains("/") || value.Contains(".."))
            {
                return $"/{value.TrimStart('/')}";
            }

            return $"/uploads/lessons/{value}";
        }



        private static string? TryBuildLessonImageDataUrl(IWebHostEnvironment environment, string normalizedUrl)
        {
            if (environment == null
                || string.IsNullOrWhiteSpace(normalizedUrl)
                || !normalizedUrl.StartsWith("/uploads/lessons/", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            string relativePath = normalizedUrl.TrimStart('/')
                .Replace('/', Path.DirectorySeparatorChar);

            foreach (var webRoot in GetCandidateWebRoots(environment))
            {
                var filePath = Path.Combine(webRoot, relativePath);

                if (!File.Exists(filePath))
                {
                    continue;
                }

                try
                {
                    byte[] bytes = File.ReadAllBytes(filePath);
                    string? contentType = GetContentType(filePath);

                    if (bytes.Length == 0 || string.IsNullOrWhiteSpace(contentType))
                    {
                        continue;
                    }

                    return $"data:{contentType};base64,{Convert.ToBase64String(bytes)}";
                }
                catch
                {
                    continue;
                }
            }

            return null;
        }

        private static IEnumerable<string> GetCandidateWebRoots(IWebHostEnvironment environment)
        {
            var roots = new[]
            {
                environment.WebRootPath,
                !string.IsNullOrWhiteSpace(environment.ContentRootPath)
                    ? Path.Combine(environment.ContentRootPath, "wwwroot")
                    : null,
                Path.Combine(AppContext.BaseDirectory, "wwwroot"),
                Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")
            };

            return roots
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => Path.GetFullPath(x!))
                .Distinct(StringComparer.OrdinalIgnoreCase);
        }

        private static string? GetContentType(string filePath)
        {
            string extension = Path.GetExtension(filePath).ToLowerInvariant();

            return extension switch
            {
                ".png" => "image/png",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                _ => null
            };
        }


        private static string? TryExtractPublicPath(string value)
        {
            string normalized = value.Trim().Replace('\\', '/');
            string lowerValue = normalized.ToLowerInvariant();

            string[] markers =
            {
                "/uploads/lessons/",
                "uploads/lessons/",
                "/uploads/",
                "uploads/",
                "/avatars/",
                "avatars/"
            };

            foreach (var marker in markers)
            {
                int markerIndex = lowerValue.IndexOf(marker, StringComparison.Ordinal);

                if (markerIndex < 0)
                {
                    continue;
                }

                string path = normalized.Substring(markerIndex);

                if (!path.StartsWith("/"))
                {
                    path = $"/{path.TrimStart('/')}";
                }

                return path;
            }

            return null;
        }
    }
}
