using NotionClone.Domain.Enums;

namespace NotionClone.Application.DTOs.Workspace;

public record WorkspaceDto(
    Guid Id,
    string Name,
    string Slug,
    string? IconEmoji,
    string? IconUrl,
    WorkspacePlan Plan,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateWorkspaceRequest(
    string Name,
    string? IconEmoji,
    string? IconUrl
);

public record UpdateWorkspaceRequest(
    string? Name,
    string? IconEmoji,
    string? IconUrl,
    WorkspacePlan? Plan
);

public record WorkspaceMemberDto(
    Guid Id,
    Guid WorkspaceId,
    Guid UserId,
    string UserName,
    string UserEmail,
    string? UserAvatarUrl,
    UserRole Role,
    DateTime JoinedAt
);

public record InviteMemberRequest(
    string Email,
    UserRole Role
);

public record UpdateMemberRoleRequest(
    UserRole Role
);
