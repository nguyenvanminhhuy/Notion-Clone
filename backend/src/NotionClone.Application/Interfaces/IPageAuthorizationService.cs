namespace NotionClone.Application.Interfaces;

public enum PagePermission
{
    Read,
    Comment,
    Edit,
    Move,
    Archive,
    Restore,
    DeletePermanently,
    ManageSharing,
    Publish
}

public interface IPageAuthorizationService
{
    Task<bool> HasPagePermissionAsync(Guid userId, Guid pageId, PagePermission permission, CancellationToken ct = default);
    Task EnsurePagePermissionAsync(Guid userId, Guid pageId, PagePermission permission, CancellationToken ct = default);
    Task EnsureCanCreatePageAsync(Guid userId, Guid workspaceId, CancellationToken ct = default);
    Task EnsureCanEmptyTrashAsync(Guid userId, Guid workspaceId, CancellationToken ct = default);
}
