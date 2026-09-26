namespace NotionClone.Application.DTOs.Page;

public record PageDto(
    Guid Id,
    Guid WorkspaceId,
    Guid? ParentId,
    string Title,
    string? Icon,
    string? Cover,
    string Content,
    bool IsFavorite,
    bool IsArchived,
    bool IsPublic,
    Guid CreatedById,
    Guid LastEditedById,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastOpenedAt
);

public record PageTreeItemDto(
    Guid Id,
    Guid WorkspaceId,
    Guid? ParentId,
    string Title,
    string? Icon,
    bool IsFavorite,
    bool IsArchived,
    DateTime UpdatedAt,
    List<PageTreeItemDto> Children
);

public record CreatePageRequest(
    Guid? ParentId,
    string? Title,
    string? Icon,
    string? Cover,
    string? Content
);

public record UpdatePageRequest(
    string? Title,
    string? Icon,
    string? Cover,
    string? Content,
    bool? IsFavorite,
    bool? IsArchived,
    bool? IsPublic
);

public record MovePageRequest(
    Guid? TargetParentId
);

public record UpdatePageContentRequest(
    string Content
);
