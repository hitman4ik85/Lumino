using Lumino.Api.Application.DTOs;

namespace Lumino.Api.Application.Interfaces
{
    public interface IAdminUserService
    {
        List<AdminUserResponse> GetAll();
        AdminUserResponse Create(AdminUserUpsertRequest request, int currentAdminUserId);
        AdminUserResponse Update(int id, AdminUserUpsertRequest request, int currentAdminUserId);
        void Delete(int id, int currentAdminUserId);
    }
}
