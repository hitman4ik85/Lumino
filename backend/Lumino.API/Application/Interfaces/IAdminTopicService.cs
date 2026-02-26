using Lumino.Api.Application.DTOs;
using System.Collections.Generic;

namespace Lumino.Api.Application.Interfaces
{
    public interface IAdminTopicService
    {
        List<AdminTopicResponse> GetByCourse(int courseId);

        AdminTopicDetailsResponse GetById(int id);

        AdminTopicResponse Create(CreateTopicRequest request);

        void Update(int id, UpdateTopicRequest request);

        void Delete(int id);
    }
}
