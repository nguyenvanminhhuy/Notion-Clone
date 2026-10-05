using Microsoft.EntityFrameworkCore;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.Comment;
using NotionClone.Application.Interfaces;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Infrastructure.Services;

public class CommentService : ICommentService
{
    private readonly NotionDbContext _dbContext;
    private readonly IPageAuthorizationService _authorization;

    public CommentService(NotionDbContext dbContext, IPageAuthorizationService? authorization = null)
    {
        _dbContext = dbContext;
        _authorization = authorization ?? new PageAuthorizationService(dbContext);
    }

    public async Task<IEnumerable<CommentDto>> GetPageCommentsAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var page = await _dbContext.Pages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pageId, ct)
            ?? throw new NotFoundException($"Page with ID '{pageId}' was not found.");

        await _authorization.EnsurePagePermissionAsync(userId, pageId, PagePermission.Read, ct);

        var topLevelComments = await _dbContext.Comments
            .AsNoTracking()
            .Include(c => c.User)
            .Include(c => c.Replies)
                .ThenInclude(r => r.User)
            .Where(c => c.PageId == pageId && c.ParentId == null)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(ct);

        return topLevelComments.Select(MapToCommentDto);
    }

    public async Task<CommentDto> CreateCommentAsync(Guid userId, Guid pageId, CreateCommentRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ValidationException("Comment content cannot be empty.");
        }

        var page = await _dbContext.Pages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pageId, ct)
            ?? throw new NotFoundException($"Page with ID '{pageId}' was not found.");

        await _authorization.EnsurePagePermissionAsync(userId, pageId, PagePermission.Comment, ct);

        if (request.ParentId.HasValue)
        {
            var validParent = await _dbContext.Comments
                .AsNoTracking()
                .AnyAsync(comment => comment.Id == request.ParentId.Value && comment.PageId == pageId, ct);
            if (!validParent)
                throw new ValidationException("The parent comment must belong to the same page.");
        }

        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException($"User with ID '{userId}' was not found.");

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            PageId = pageId,
            UserId = userId,
            ParentId = request.ParentId,
            Content = request.Content.Trim(),
            IsResolved = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Comments.Add(comment);
        await _dbContext.SaveChangesAsync(ct);

        return new CommentDto(
            comment.Id,
            comment.PageId,
            comment.UserId,
            user.Name,
            user.AvatarUrl,
            comment.Content,
            comment.CreatedAt,
            comment.IsResolved,
            new List<CommentReplyDto>()
        );
    }

    public async Task<CommentReplyDto> ReplyToCommentAsync(Guid userId, Guid commentId, ReplyCommentRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ValidationException("Reply content cannot be empty.");
        }

        var parentComment = await _dbContext.Comments
            .Include(c => c.Page)
            .FirstOrDefaultAsync(c => c.Id == commentId, ct)
            ?? throw new NotFoundException($"Comment with ID '{commentId}' was not found.");

        await _authorization.EnsurePagePermissionAsync(userId, parentComment.PageId, PagePermission.Comment, ct);

        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException($"User with ID '{userId}' was not found.");

        var reply = new Comment
        {
            Id = Guid.NewGuid(),
            PageId = parentComment.PageId,
            UserId = userId,
            ParentId = parentComment.Id,
            Content = request.Content.Trim(),
            IsResolved = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Comments.Add(reply);
        await _dbContext.SaveChangesAsync(ct);

        return new CommentReplyDto(
            reply.Id,
            reply.UserId,
            user.Name,
            user.AvatarUrl,
            reply.Content,
            reply.CreatedAt
        );
    }

    public async Task<CommentDto> UpdateCommentAsync(Guid userId, Guid commentId, UpdateCommentRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ValidationException("Comment content cannot be empty.");
        }

        var comment = await _dbContext.Comments
            .Include(c => c.Page)
            .Include(c => c.User)
            .Include(c => c.Replies)
                .ThenInclude(r => r.User)
            .FirstOrDefaultAsync(c => c.Id == commentId, ct)
            ?? throw new NotFoundException($"Comment with ID '{commentId}' was not found.");

        await _authorization.EnsurePagePermissionAsync(userId, comment.PageId, PagePermission.Comment, ct);
        var canModerate = await _authorization.HasPagePermissionAsync(userId, comment.PageId, PagePermission.ManageSharing, ct);

        if (comment.UserId != userId && !canModerate)
        {
            throw new ForbiddenException("You can only edit your own comments.");
        }

        comment.Content = request.Content.Trim();
        comment.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        return MapToCommentDto(comment);
    }

    public async Task<CommentDto> ResolveCommentAsync(Guid userId, Guid commentId, CancellationToken ct = default)
    {
        var comment = await _dbContext.Comments
            .Include(c => c.Page)
            .Include(c => c.User)
            .Include(c => c.Replies)
                .ThenInclude(r => r.User)
            .FirstOrDefaultAsync(c => c.Id == commentId, ct)
            ?? throw new NotFoundException($"Comment with ID '{commentId}' was not found.");

        await _authorization.EnsurePagePermissionAsync(userId, comment.PageId, PagePermission.Edit, ct);

        comment.IsResolved = !comment.IsResolved;
        comment.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        return MapToCommentDto(comment);
    }

    public async Task DeleteCommentAsync(Guid userId, Guid commentId, CancellationToken ct = default)
    {
        var comment = await _dbContext.Comments
            .Include(c => c.Page)
            .Include(c => c.Replies)
            .FirstOrDefaultAsync(c => c.Id == commentId, ct)
            ?? throw new NotFoundException($"Comment with ID '{commentId}' was not found.");

        await _authorization.EnsurePagePermissionAsync(userId, comment.PageId, PagePermission.Comment, ct);
        var canModerate = await _authorization.HasPagePermissionAsync(userId, comment.PageId, PagePermission.ManageSharing, ct);

        if (comment.UserId != userId && !canModerate)
        {
            throw new ForbiddenException("You can only delete your own comments.");
        }

        if (comment.Replies.Any())
        {
            _dbContext.Comments.RemoveRange(comment.Replies);
        }

        _dbContext.Comments.Remove(comment);
        await _dbContext.SaveChangesAsync(ct);
    }

    private async Task<WorkspaceMember> EnsureWorkspaceMemberAsync(Guid userId, Guid workspaceId, CancellationToken ct)
    {
        var member = await _dbContext.WorkspaceMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId, ct);

        if (member == null)
        {
            throw new ForbiddenException("You do not have access to this workspace.");
        }

        return member;
    }

    private static CommentDto MapToCommentDto(Comment c) =>
        new(
            c.Id,
            c.PageId,
            c.UserId,
            c.User?.Name ?? string.Empty,
            c.User?.AvatarUrl,
            c.Content,
            c.CreatedAt,
            c.IsResolved,
            c.Replies
                .OrderBy(r => r.CreatedAt)
                .Select(r => new CommentReplyDto(
                    r.Id,
                    r.UserId,
                    r.User?.Name ?? string.Empty,
                    r.User?.AvatarUrl,
                    r.Content,
                    r.CreatedAt
                ))
                .ToList()
        );
}
