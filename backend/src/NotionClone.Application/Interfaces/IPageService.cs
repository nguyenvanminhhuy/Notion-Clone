using NotionClone.Application.DTOs.Page;

namespace NotionClone.Application.Interfaces;

public interface IPageService
{
    Task<IEnumerable<PageDto>> GetWorkspacePagesAsync(Guid userId, Guid workspaceId, CancellationToken ct = default);
    Task<IEnumerable<PageTreeItemDto>> GetWorkspacePageTreeAsync(Guid userId, Guid workspaceId, CancellationToken ct = default);
    Task<PageDto> GetPageByIdAsync(Guid userId, Guid pageId, CancellationToken ct = default);
    Task<PageDto> CreatePageAsync(Guid userId, Guid workspaceId, CreatePageRequest request, CancellationToken ct = default);
    Task<PageDto> UpdatePageAsync(Guid userId, Guid pageId, UpdatePageRequest request, CancellationToken ct = default);
    Task<PageDto> MovePageAsync(Guid userId, Guid pageId, MovePageRequest request, CancellationToken ct = default);
    Task SoftDeletePageAsync(Guid userId, Guid pageId, CancellationToken ct = default);
    Task<PageDto> RestorePageAsync(Guid userId, Guid pageId, CancellationToken ct = default);
    Task PermanentDeletePageAsync(Guid userId, Guid pageId, CancellationToken ct = default);
    Task<PageDto> DuplicatePageAsync(Guid userId, Guid pageId, CancellationToken ct = default);
    Task<PageDto> ToggleFavoriteAsync(Guid userId, Guid pageId, CancellationToken ct = default);
    Task RecordOpenAsync(Guid userId, Guid pageId, CancellationToken ct = default);

    Task<string> GetPageContentAsync(Guid userId, Guid pageId, CancellationToken ct = default);
    Task<PageDto> UpdatePageContentAsync(Guid userId, Guid pageId, UpdatePageContentRequest request, CancellationToken ct = default);
    Task<IEnumerable<PageVersionDto>> GetPageVersionsAsync(Guid userId, Guid pageId, CancellationToken ct = default);
    Task<PageVersionDetailDto> GetPageVersionByIdAsync(Guid userId, Guid pageId, Guid versionId, CancellationToken ct = default);
    Task<PageDto> RestorePageVersionAsync(Guid userId, Guid pageId, Guid versionId, CancellationToken ct = default);

    Task<IEnumerable<PageDto>> GetFavoritePagesAsync(Guid userId, Guid workspaceId, CancellationToken ct = default);
    Task<PageDto> RemoveFavoriteAsync(Guid userId, Guid pageId, CancellationToken ct = default);
    Task<IEnumerable<PageDto>> GetTrashPagesAsync(Guid userId, Guid workspaceId, CancellationToken ct = default);
    Task EmptyTrashAsync(Guid userId, Guid workspaceId, CancellationToken ct = default);
}
