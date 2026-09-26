using NotionClone.Application.DTOs.Workspace;

namespace NotionClone.Application.Interfaces;

public interface IWorkspaceService
{
    Task<IEnumerable<WorkspaceDto>> GetUserWorkspacesAsync(Guid userId, CancellationToken ct = default);
    Task<WorkspaceDto> CreateWorkspaceAsync(Guid userId, CreateWorkspaceRequest request, CancellationToken ct = default);
    Task<WorkspaceDto> GetWorkspaceByIdAsync(Guid userId, Guid workspaceId, CancellationToken ct = default);
    Task<WorkspaceDto> UpdateWorkspaceAsync(Guid userId, Guid workspaceId, UpdateWorkspaceRequest request, CancellationToken ct = default);
    Task DeleteWorkspaceAsync(Guid userId, Guid workspaceId, CancellationToken ct = default);

    Task<IEnumerable<WorkspaceMemberDto>> GetMembersAsync(Guid userId, Guid workspaceId, CancellationToken ct = default);
    Task<WorkspaceMemberDto> AddMemberAsync(Guid userId, Guid workspaceId, InviteMemberRequest request, CancellationToken ct = default);
    Task<WorkspaceMemberDto> UpdateMemberRoleAsync(Guid userId, Guid workspaceId, Guid memberId, UpdateMemberRoleRequest request, CancellationToken ct = default);
    Task RemoveMemberAsync(Guid userId, Guid workspaceId, Guid memberId, CancellationToken ct = default);
}
