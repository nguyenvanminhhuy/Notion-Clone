using NotionClone.Domain.Enums;

namespace NotionClone.Application.DTOs.Share;

public record PageShareDto(
    Guid Id,
    Guid PageId,
    Guid? UserId,
    string? UserEmail,
    string? UserName,
    string? UserAvatarUrl,
    string? Email,
    PageRole Role,
    DateTime CreatedAt
);

public record CreateShareRequest(
    string Email,
    PageRole Role
);

public record UpdateShareRoleRequest(
    PageRole Role
);

public record TogglePublicAccessRequest(
    bool IsPublic
);
