using System.Collections.Generic;

namespace Lumino.Api.Application.DTOs
{
    public class MediaFileResponse
    {
        public string FileName { get; set; } = null!;

        public string Url { get; set; } = null!;

        public long SizeBytes { get; set; }

        public DateTime LastModifiedUtc { get; set; }

        public string? Extension { get; set; }

        public List<string> Bindings { get; set; } = new();

        public int BindingCount { get; set; }
    }
}
