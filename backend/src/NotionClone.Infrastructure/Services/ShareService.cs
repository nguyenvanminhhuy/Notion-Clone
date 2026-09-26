using Microsoft.EntityFrameworkCore;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.Page;
using NotionClone.Application.DTOs.Share;
using NotionClone.Application.Interfaces;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Infrastructure.Services;

public class ShareService : IShareService
{
    private readonly NotionDbContext _dbContext;

    public ShareService(NotionDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<PageShareDto>> GetPageSharesAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var page = await _dbContext.Pages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pageId, ct)
            ?? throw new NotFoundException($"Page with ID '{pageId}' was not found.");

        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        var shares = await _dbContext.PageShares
            .AsNoTracking()
            .Include(ps => ps.User)
            .Where(ps => ps.PageId == pageId)
            .OrderBy(ps => ps.CreatedAt)
            .Select(ps => MapToPageShareDto(ps))
            .ToListAsync(ct);

        return shares;
    }

    public async Task<PageShareDto> SharePageAsync(Guid userId, Guid pageId, CreateShareRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ValidationException("Email is required for page sharing.");
        }

        var page = await _dbContext.Pages
            .Include(p => p.Workspace)
            .FirstOrDefaultAsync(p => p.Id == pageId, ct)
            ?? throw new NotFoundException($"Page with ID '{pageId}' was not found.");

        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var targetUser = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, ct);

        var existingShare = await _dbContext.PageShares
            .AnyAsync(ps => ps.PageId == pageId && (ps.Email == normalizedEmail || (targetUser != null && ps.UserId == targetUser.Id)), ct);

        if (existingShare)
        {
            throw new ConflictException($"Page is already shared with '{request.Email}'.");
        }

        var share = new PageShare
        {
            Id = Guid.NewGuid(),
            PageId = pageId,
            UserId = targetUser?.Id,
            Email = targetUser == null ? normalizedEmail : null,
            Role = request.Role,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.PageShares.Add(share);
        await _dbContext.SaveChangesAsync(ct);

        return new PageShareDto(
            share.Id,
            share.PageId,
            share.UserId,
            targetUser?.Email,
            targetUser?.Name,
            targetUser?.AvatarUrl,
            share.Email,
            share.Role,
            share.CreatedAt
        );
    }

    public async Task<PageShareDto> UpdateShareRoleAsync(Guid userId, Guid shareId, UpdateShareRoleRequest request, CancellationToken ct = default)
    {
        var share = await _dbContext.PageShares
            .Include(ps => ps.Page)
            .Include(ps => ps.User)
            .FirstOrDefaultAsync(ps => ps.Id == shareId, ct)
            ?? throw new NotFoundException($"Share record with ID '{shareId}' was not found.");

        await EnsureWorkspaceMemberAsync(userId, share.Page.WorkspaceId, ct);

        share.Role = request.Role;
        share.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        return MapToPageShareDto(share);
    }

    public async Task RemoveShareAsync(Guid userId, Guid shareId, CancellationToken ct = default)
    {
        var share = await _dbContext.PageShares
            .Include(ps => ps.Page)
            .FirstOrDefaultAsync(ps => ps.Id == shareId, ct)
            ?? throw new NotFoundException($"Share record with ID '{shareId}' was not found.");

        await EnsureWorkspaceMemberAsync(userId, share.Page.WorkspaceId, ct);

        _dbContext.PageShares.Remove(share);
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<PageDto> TogglePublicAccessAsync(Guid userId, Guid pageId, TogglePublicAccessRequest request, CancellationToken ct = default)
    {
        var page = await _dbContext.Pages
            .FirstOrDefaultAsync(p => p.Id == pageId, ct)
            ?? throw new NotFoundException($"Page with ID '{pageId}' was not found.");

        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        page.IsPublic = request.IsPublic;
        page.LastEditedById = userId;
        page.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        return MapToPageDto(page);
    }

    public async Task<PageDto> GetPublicPageAsync(Guid pageId, CancellationToken ct = default)
    {
        var page = await _dbContext.Pages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pageId && p.IsPublic && !p.IsArchived, ct)
            ?? throw new NotFoundException($"Public page with ID '{pageId}' was not found.");

        return MapToPageDto(page);
    }

    private async Task EnsureWorkspaceMemberAsync(Guid userId, Guid workspaceId, CancellationToken ct)
    {
        var isMember = await _dbContext.WorkspaceMembers
            .AsNoTracking()
            .AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId, ct);

        if (!isMember)
        {
            throw new ForbiddenException("You do not have access to this workspace.");
        }
    }

    private static PageShareDto MapToPageShareDto(PageShare ps) =>
        new(
            ps.Id,
            ps.PageId,
            ps.UserId,
            ps.User?.Email,
            ps.User?.Name,
            ps.User?.AvatarUrl,
            ps.Email,
            ps.Role,
            ps.CreatedAt
        );

    private static PageDto MapToPageDto(Page p) =>
        new(p.Id, p.WorkspaceId, p.ParentId, p.Title, p.Icon, p.Cover, p.Content, p.IsFavorite, p.IsArchived, p.IsPublic, p.CreatedById, p.LastEditedById, p.CreatedAt, p.UpdatedAt, p.LastOpenedAt);
}
