using Lumino.Api.Application.DTOs;

namespace Lumino.Api.Application.Interfaces
{
    public interface IRefreshTokenCleanupService
    {
        List<AdminRefreshTokenResponse> GetAll();

        int Cleanup(bool deleteRevokedNow = false);
    }
}
