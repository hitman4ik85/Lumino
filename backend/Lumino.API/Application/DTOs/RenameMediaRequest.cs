namespace Lumino.Api.Application.DTOs
{
    public class RenameMediaRequest
    {
        public string Path { get; set; } = null!;

        public string NewFileName { get; set; } = null!;
    }
}
