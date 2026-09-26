namespace NotionClone.Application.DTOs.Comment;

public record CommentReplyDto(
    Guid Id,
    Guid UserId,
    string UserName,
    string? UserAvatarUrl,
    string Content,
    DateTime CreatedAt
);

public record CommentDto(
    Guid Id,
    Guid PageId,
    Guid UserId,
    string UserName,
    string? UserAvatarUrl,
    string Content,
    DateTime CreatedAt,
    bool Resolved,
    List<CommentReplyDto> Replies
);

public record CreateCommentRequest(
    string Content,
    Guid? ParentId
);

public record UpdateCommentRequest(
    string Content
);

public record ReplyCommentRequest(
    string Content
);
