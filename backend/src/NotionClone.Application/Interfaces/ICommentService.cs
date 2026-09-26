using NotionClone.Application.DTOs.Comment;

namespace NotionClone.Application.Interfaces;

public interface ICommentService
{
    Task<IEnumerable<CommentDto>> GetPageCommentsAsync(Guid userId, Guid pageId, CancellationToken ct = default);
    Task<CommentDto> CreateCommentAsync(Guid userId, Guid pageId, CreateCommentRequest request, CancellationToken ct = default);
    Task<CommentReplyDto> ReplyToCommentAsync(Guid userId, Guid commentId, ReplyCommentRequest request, CancellationToken ct = default);
    Task<CommentDto> UpdateCommentAsync(Guid userId, Guid commentId, UpdateCommentRequest request, CancellationToken ct = default);
    Task<CommentDto> ResolveCommentAsync(Guid userId, Guid commentId, CancellationToken ct = default);
    Task DeleteCommentAsync(Guid userId, Guid commentId, CancellationToken ct = default);
}
