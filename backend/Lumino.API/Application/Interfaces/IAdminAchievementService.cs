using Lumino.Api.Application.DTOs;

namespace Lumino.Api.Application.Interfaces
{
    public interface IAdminAchievementService
    {
        List<AdminAchievementResponse> GetAll();

        AdminAchievementResponse GetById(int id);

        AdminAchievementResponse Create(CreateAchievementRequest request);

        void Update(int id, UpdateAchievementRequest request);

        void Delete(int id);
    }
}
