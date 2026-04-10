using Lumino.Api.Application.DTOs;
using Microsoft.AspNetCore.Http;

namespace Lumino.Api.Application.Interfaces
{
    public interface IMediaService
    {
        UploadMediaResponse Upload(IFormFile file, string baseUrl, string? folder = null);

        List<MediaFileResponse> List(string baseUrl, string? query = null, int skip = 0, int take = 100);

        void Delete(string path);

        MediaFileResponse Rename(string path, string newFileName, string baseUrl);
    }
}
