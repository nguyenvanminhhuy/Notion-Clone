using NotionClone.Application.DTOs.Page;
using NotionClone.Application.DTOs.Share;

namespace NotionClone.Application.Interfaces;

public interface IShareService
{
    Task<IEnumerable<PageShareDto>> GetPageSharesAsync(Guid userId, Guid pageId, CancellationToken ct = default);
    Task<PageShareDto> SharePageAsync(Guid userId, Guid pageId, CreateShareRequest request, CancellationToken ct = default);
    Task<PageShareDto> UpdateShareRoleAsync(Guid userId, Guid shareId, UpdateShareRoleRequest request, CancellationToken ct = default);
    Task RemoveShareAsync(Guid userId, Guid shareId, CancellationToken ct = default);
    Task<PageDto> TogglePublicAccessAsync(Guid userId, Guid pageId, TogglePublicAccessRequest request, CancellationToken ct = default);
    Task<PageDto> GetPublicPageAsync(Guid pageId, CancellationToken ct = default);
}
