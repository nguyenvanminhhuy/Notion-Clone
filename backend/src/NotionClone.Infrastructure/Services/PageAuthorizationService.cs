using Microsoft.EntityFrameworkCore;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.Interfaces;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Infrastructure.Services;

public sealed class PageAuthorizationService : IPageAuthorizationService
{
    private readonly NotionDbContext _dbContext;

    public PageAuthorizationService(NotionDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> HasPagePermissionAsync(
        Guid userId,
        Guid pageId,
        PagePermission permission,
        CancellationToken ct = default)
    {
        var page = await _dbContext.Pages
            .AsNoTracking()
            .Where(p => p.Id == pageId)
            .Select(p => new { p.WorkspaceId })
            .FirstOrDefaultAsync(ct);

        if (page is null)
            throw new NotFoundException($"Page with ID '{pageId}' was not found.");

        var workspaceRole = await _dbContext.WorkspaceMembers
            .AsNoTracking()
            .Where(m => m.WorkspaceId == page.WorkspaceId && m.UserId == userId)
            .Select(m => (UserRole?)m.Role)
            .FirstOrDefaultAsync(ct);

        if (workspaceRole.HasValue)
            return WorkspaceRoleAllows(workspaceRole.Value, permission);

        var email = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.Email)
            .FirstOrDefaultAsync(ct);

        if (email is null)
            return false;

        var pageRole = await _dbContext.PageShares
            .AsNoTracking()
            .Where(s => s.PageId == pageId &&
                        (s.UserId == userId || (s.Email != null && s.Email.ToLower() == email.ToLower())))
            .Select(s => (PageRole?)s.Role)
            .FirstOrDefaultAsync(ct);

        return pageRole.HasValue && PageRoleAllows(pageRole.Value, permission);
    }

    public async Task EnsurePagePermissionAsync(
        Guid userId,
        Guid pageId,
        PagePermission permission,
        CancellationToken ct = default)
    {
        if (!await HasPagePermissionAsync(userId, pageId, permission, ct))
            throw new ForbiddenException($"You do not have permission to {Describe(permission)} this page.");
    }

    public async Task EnsureCanCreatePageAsync(Guid userId, Guid workspaceId, CancellationToken ct = default)
    {
        var role = await GetWorkspaceRoleAsync(userId, workspaceId, ct);
        if (role is null || role == UserRole.Guest)
            throw new ForbiddenException("You do not have permission to create pages in this workspace.");
    }

    public async Task EnsureCanEmptyTrashAsync(Guid userId, Guid workspaceId, CancellationToken ct = default)
    {
        var role = await GetWorkspaceRoleAsync(userId, workspaceId, ct);
        if (role is not (UserRole.Owner or UserRole.Admin))
            throw new ForbiddenException("Only workspace owners and admins can empty trash.");
    }

    private async Task<UserRole?> GetWorkspaceRoleAsync(Guid userId, Guid workspaceId, CancellationToken ct) =>
        await _dbContext.WorkspaceMembers
            .AsNoTracking()
            .Where(m => m.WorkspaceId == workspaceId && m.UserId == userId)
            .Select(m => (UserRole?)m.Role)
            .FirstOrDefaultAsync(ct);

    private static bool WorkspaceRoleAllows(UserRole role, PagePermission permission) => role switch
    {
        UserRole.Owner or UserRole.Admin => true,
        UserRole.Member => permission is PagePermission.Read
            or PagePermission.Comment
            or PagePermission.Edit
            or PagePermission.Move
            or PagePermission.Archive
            or PagePermission.Restore,
        UserRole.Guest => permission is PagePermission.Read or PagePermission.Comment,
        _ => false
    };

    private static bool PageRoleAllows(PageRole role, PagePermission permission) => role switch
    {
        PageRole.Owner => true,
        PageRole.Editor => permission is PagePermission.Read or PagePermission.Comment or PagePermission.Edit,
        PageRole.Viewer => permission is PagePermission.Read or PagePermission.Comment,
        _ => false
    };

    private static string Describe(PagePermission permission) => permission switch
    {
        PagePermission.Read => "read",
        PagePermission.Comment => "comment on",
        PagePermission.Edit => "edit",
        PagePermission.Move => "move",
        PagePermission.Archive => "archive",
        PagePermission.Restore => "restore",
        PagePermission.DeletePermanently => "permanently delete",
        PagePermission.ManageSharing => "manage sharing for",
        PagePermission.Publish => "publish",
        _ => "access"
    };
}
