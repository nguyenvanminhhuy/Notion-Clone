using Microsoft.EntityFrameworkCore;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.Page;
using NotionClone.Application.Interfaces;
using NotionClone.Domain.Entities;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Infrastructure.Services;

public class PageService : IPageService
{
    private readonly NotionDbContext _dbContext;

    public PageService(NotionDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<PageDto>> GetWorkspacePagesAsync(Guid userId, Guid workspaceId, CancellationToken ct = default)
    {
        await EnsureWorkspaceMemberAsync(userId, workspaceId, ct);

        var pages = await _dbContext.Pages
            .AsNoTracking()
            .Where(p => p.WorkspaceId == workspaceId && !p.IsArchived)
            .OrderBy(p => p.Title)
            .ToListAsync(ct);

        return pages.Select(MapToPageDto);
    }

    public async Task<IEnumerable<PageTreeItemDto>> GetWorkspacePageTreeAsync(Guid userId, Guid workspaceId, CancellationToken ct = default)
    {
        await EnsureWorkspaceMemberAsync(userId, workspaceId, ct);

        var pages = await _dbContext.Pages
            .AsNoTracking()
            .Where(p => p.WorkspaceId == workspaceId && !p.IsArchived)
            .ToListAsync(ct);

        var pageMap = pages.ToDictionary(p => p.Id);
        var rootItems = new List<PageTreeItemDto>();
        var childrenMap = new Dictionary<Guid, List<PageTreeItemDto>>();

        foreach (var page in pages)
        {
            var item = new PageTreeItemDto(
                page.Id,
                page.WorkspaceId,
                page.ParentId,
                page.Title,
                page.Icon,
                page.IsFavorite,
                page.IsArchived,
                page.UpdatedAt,
                new List<PageTreeItemDto>()
            );

            if (!page.ParentId.HasValue || !pageMap.ContainsKey(page.ParentId.Value))
            {
                rootItems.Add(item);
            }
            else
            {
                if (!childrenMap.ContainsKey(page.ParentId.Value))
                {
                    childrenMap[page.ParentId.Value] = new List<PageTreeItemDto>();
                }
                childrenMap[page.ParentId.Value].Add(item);
            }
        }

        // Attach children recursively
        void PopulateChildren(PageTreeItemDto node)
        {
            if (childrenMap.TryGetValue(node.Id, out var children))
            {
                node.Children.AddRange(children);
                foreach (var child in children)
                {
                    PopulateChildren(child);
                }
            }
        }

        foreach (var root in rootItems)
        {
            PopulateChildren(root);
        }

        return rootItems;
    }

    public async Task<PageDto> GetPageByIdAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var page = await _dbContext.Pages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pageId && !p.IsArchived, ct)
            ?? throw new NotFoundException($"Page with ID '{pageId}' was not found.");

        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        return MapToPageDto(page);
    }

    public async Task<PageDto> CreatePageAsync(Guid userId, Guid workspaceId, CreatePageRequest request, CancellationToken ct = default)
    {
        await EnsureWorkspaceMemberAsync(userId, workspaceId, ct);

        if (request.ParentId.HasValue)
        {
            var parent = await _dbContext.Pages
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.ParentId.Value && p.WorkspaceId == workspaceId, ct)
                ?? throw new NotFoundException($"Parent page with ID '{request.ParentId.Value}' was not found in this workspace.");
        }

        var defaultContent = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\"}]}";

        var page = new Page
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            ParentId = request.ParentId,
            Title = string.IsNullOrWhiteSpace(request.Title) ? "Untitled" : request.Title.Trim(),
            Icon = request.Icon,
            Cover = request.Cover,
            Content = string.IsNullOrWhiteSpace(request.Content) ? defaultContent : request.Content,
            IsFavorite = false,
            IsArchived = false,
            IsPublic = false,
            CreatedById = userId,
            LastEditedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Pages.Add(page);
        await _dbContext.SaveChangesAsync(ct);

        return MapToPageDto(page);
    }

    public async Task<PageDto> UpdatePageAsync(Guid userId, Guid pageId, UpdatePageRequest request, CancellationToken ct = default)
    {
        var page = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        if (request.Title != null) page.Title = string.IsNullOrWhiteSpace(request.Title) ? "Untitled" : request.Title.Trim();
        if (request.Icon != null) page.Icon = request.Icon;
        if (request.Cover != null) page.Cover = request.Cover;
        if (request.Content != null) page.Content = request.Content;
        if (request.IsFavorite.HasValue) page.IsFavorite = request.IsFavorite.Value;
        if (request.IsArchived.HasValue) page.IsArchived = request.IsArchived.Value;
        if (request.IsPublic.HasValue) page.IsPublic = request.IsPublic.Value;

        page.LastEditedById = userId;
        page.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        return MapToPageDto(page);
    }

    public async Task<PageDto> MovePageAsync(Guid userId, Guid pageId, MovePageRequest request, CancellationToken ct = default)
    {
        var page = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        if (request.TargetParentId.HasValue)
        {
            var targetParentId = request.TargetParentId.Value;

            if (targetParentId == pageId)
            {
                throw new ValidationException("Cannot set a page as its own parent.");
            }

            var targetParent = await _dbContext.Pages
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == targetParentId && p.WorkspaceId == page.WorkspaceId, ct)
                ?? throw new NotFoundException($"Target parent page with ID '{targetParentId}' was not found in this workspace.");

            // Cycle detection: traverse up from targetParentId to root
            var currentId = (Guid?)targetParentId;
            while (currentId.HasValue)
            {
                if (currentId.Value == pageId)
                {
                    throw new ValidationException("Cannot move a page to one of its own descendants.");
                }

                var ancestor = await _dbContext.Pages
                    .AsNoTracking()
                    .Where(p => p.Id == currentId.Value)
                    .Select(p => p.ParentId)
                    .FirstOrDefaultAsync(ct);

                currentId = ancestor;
            }
        }

        page.ParentId = request.TargetParentId;
        page.LastEditedById = userId;
        page.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        return MapToPageDto(page);
    }

    public async Task SoftDeletePageAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var page = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        var descendantIds = await GetAllDescendantIdsAsync(pageId, ct);
        descendantIds.Add(pageId);

        var pagesToArchive = await _dbContext.Pages
            .Where(p => descendantIds.Contains(p.Id))
            .ToListAsync(ct);

        foreach (var p in pagesToArchive)
        {
            p.IsArchived = true;
            p.LastEditedById = userId;
            p.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<PageDto> RestorePageAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var page = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        page.IsArchived = false;
        page.LastEditedById = userId;
        page.UpdatedAt = DateTime.UtcNow;

        // Also un-archive parent ancestors if they are archived
        var currentParentId = page.ParentId;
        while (currentParentId.HasValue)
        {
            var parent = await _dbContext.Pages
                .FirstOrDefaultAsync(p => p.Id == currentParentId.Value, ct);

            if (parent != null && parent.IsArchived)
            {
                parent.IsArchived = false;
                parent.LastEditedById = userId;
                parent.UpdatedAt = DateTime.UtcNow;
                currentParentId = parent.ParentId;
            }
            else
            {
                break;
            }
        }

        await _dbContext.SaveChangesAsync(ct);

        return MapToPageDto(page);
    }

    public async Task PermanentDeletePageAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var page = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        var descendantIds = await GetAllDescendantIdsAsync(pageId, ct);
        descendantIds.Add(pageId);

        var pagesToDelete = await _dbContext.Pages
            .Where(p => descendantIds.Contains(p.Id))
            .ToListAsync(ct);

        _dbContext.Pages.RemoveRange(pagesToDelete);
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<PageDto> DuplicatePageAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var sourcePage = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, sourcePage.WorkspaceId, ct);

        var newRootPage = new Page
        {
            Id = Guid.NewGuid(),
            WorkspaceId = sourcePage.WorkspaceId,
            ParentId = sourcePage.ParentId,
            Title = $"{sourcePage.Title} (Copy)",
            Icon = sourcePage.Icon,
            Cover = sourcePage.Cover,
            Content = sourcePage.Content,
            IsFavorite = false,
            IsArchived = false,
            IsPublic = false,
            CreatedById = userId,
            LastEditedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Pages.Add(newRootPage);

        // Recursively copy subtree
        await DuplicateSubtreeAsync(sourcePage.Id, newRootPage.Id, sourcePage.WorkspaceId, userId, ct);

        await _dbContext.SaveChangesAsync(ct);

        return MapToPageDto(newRootPage);
    }

    public async Task<PageDto> ToggleFavoriteAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var page = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        page.IsFavorite = !page.IsFavorite;
        page.LastEditedById = userId;
        page.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        return MapToPageDto(page);
    }

    public async Task RecordOpenAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var page = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        page.LastOpenedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<string> GetPageContentAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var page = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        return page.Content;
    }

    public async Task<PageDto> UpdatePageContentAsync(Guid userId, Guid pageId, UpdatePageContentRequest request, CancellationToken ct = default)
    {
        var page = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        page.Content = request.Content ?? string.Empty;
        page.LastEditedById = userId;
        page.UpdatedAt = DateTime.UtcNow;

        var versionSnapshot = new PageVersion
        {
            Id = Guid.NewGuid(),
            PageId = page.Id,
            Content = page.Content,
            EditedById = userId,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.PageVersions.Add(versionSnapshot);
        await _dbContext.SaveChangesAsync(ct);

        return MapToPageDto(page);
    }

    public async Task<IEnumerable<PageVersionDto>> GetPageVersionsAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var page = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        var versions = await _dbContext.PageVersions
            .AsNoTracking()
            .Include(pv => pv.EditedBy)
            .Where(pv => pv.PageId == pageId)
            .OrderByDescending(pv => pv.CreatedAt)
            .Select(pv => new PageVersionDto(
                pv.Id,
                pv.PageId,
                pv.EditedById,
                pv.EditedBy != null ? pv.EditedBy.Name : string.Empty,
                pv.CreatedAt
            ))
            .ToListAsync(ct);

        return versions;
    }

    public async Task<PageVersionDetailDto> GetPageVersionByIdAsync(Guid userId, Guid pageId, Guid versionId, CancellationToken ct = default)
    {
        var page = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        var version = await _dbContext.PageVersions
            .AsNoTracking()
            .Include(pv => pv.EditedBy)
            .FirstOrDefaultAsync(pv => pv.Id == versionId && pv.PageId == pageId, ct)
            ?? throw new NotFoundException($"Version with ID '{versionId}' was not found for this page.");

        return new PageVersionDetailDto(
            version.Id,
            version.PageId,
            version.Content,
            version.EditedById,
            version.EditedBy != null ? version.EditedBy.Name : string.Empty,
            version.CreatedAt
        );
    }

    public async Task<PageDto> RestorePageVersionAsync(Guid userId, Guid pageId, Guid versionId, CancellationToken ct = default)
    {
        var page = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        var version = await _dbContext.PageVersions
            .AsNoTracking()
            .FirstOrDefaultAsync(pv => pv.Id == versionId && pv.PageId == pageId, ct)
            ?? throw new NotFoundException($"Version with ID '{versionId}' was not found for this page.");

        page.Content = version.Content;
        page.LastEditedById = userId;
        page.UpdatedAt = DateTime.UtcNow;

        var versionSnapshot = new PageVersion
        {
            Id = Guid.NewGuid(),
            PageId = page.Id,
            Content = page.Content,
            EditedById = userId,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.PageVersions.Add(versionSnapshot);
        await _dbContext.SaveChangesAsync(ct);

        return MapToPageDto(page);
    }

    public async Task<IEnumerable<PageDto>> GetFavoritePagesAsync(Guid userId, Guid workspaceId, CancellationToken ct = default)
    {
        await EnsureWorkspaceMemberAsync(userId, workspaceId, ct);

        var favorites = await _dbContext.Pages
            .AsNoTracking()
            .Where(p => p.WorkspaceId == workspaceId && !p.IsArchived && p.IsFavorite)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync(ct);

        return favorites.Select(MapToPageDto);
    }

    public async Task<PageDto> RemoveFavoriteAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var page = await GetPageEntityAsync(pageId, ct);
        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        page.IsFavorite = false;
        page.LastEditedById = userId;
        page.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        return MapToPageDto(page);
    }

    public async Task<IEnumerable<PageDto>> GetTrashPagesAsync(Guid userId, Guid workspaceId, CancellationToken ct = default)
    {
        await EnsureWorkspaceMemberAsync(userId, workspaceId, ct);

        var trashPages = await _dbContext.Pages
            .AsNoTracking()
            .Where(p => p.WorkspaceId == workspaceId && p.IsArchived)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync(ct);

        return trashPages.Select(MapToPageDto);
    }

    public async Task EmptyTrashAsync(Guid userId, Guid workspaceId, CancellationToken ct = default)
    {
        await EnsureWorkspaceMemberAsync(userId, workspaceId, ct);

        var archivedPages = await _dbContext.Pages
            .Where(p => p.WorkspaceId == workspaceId && p.IsArchived)
            .ToListAsync(ct);

        if (archivedPages.Count > 0)
        {
            _dbContext.Pages.RemoveRange(archivedPages);
            await _dbContext.SaveChangesAsync(ct);
        }
    }

    private async Task<Page> GetPageEntityAsync(Guid pageId, CancellationToken ct)
    {
        return await _dbContext.Pages.FirstOrDefaultAsync(p => p.Id == pageId, ct)
            ?? throw new NotFoundException($"Page with ID '{pageId}' was not found.");
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

    private async Task<List<Guid>> GetAllDescendantIdsAsync(Guid pageId, CancellationToken ct)
    {
        var descendantIds = new List<Guid>();
        var queue = new Queue<Guid>();
        queue.Enqueue(pageId);

        while (queue.Count > 0)
        {
            var currentId = queue.Dequeue();
            var children = await _dbContext.Pages
                .AsNoTracking()
                .Where(p => p.ParentId == currentId)
                .Select(p => p.Id)
                .ToListAsync(ct);

            foreach (var childId in children)
            {
                descendantIds.Add(childId);
                queue.Enqueue(childId);
            }
        }

        return descendantIds;
    }

    private async Task DuplicateSubtreeAsync(Guid sourceParentId, Guid newParentId, Guid workspaceId, Guid userId, CancellationToken ct)
    {
        var children = await _dbContext.Pages
            .AsNoTracking()
            .Where(p => p.ParentId == sourceParentId && !p.IsArchived)
            .ToListAsync(ct);

        foreach (var child in children)
        {
            var newChild = new Page
            {
                Id = Guid.NewGuid(),
                WorkspaceId = workspaceId,
                ParentId = newParentId,
                Title = child.Title,
                Icon = child.Icon,
                Cover = child.Cover,
                Content = child.Content,
                IsFavorite = false,
                IsArchived = false,
                IsPublic = false,
                CreatedById = userId,
                LastEditedById = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.Pages.Add(newChild);
            await DuplicateSubtreeAsync(child.Id, newChild.Id, workspaceId, userId, ct);
        }
    }

    private static PageDto MapToPageDto(Page p) =>
        new(p.Id, p.WorkspaceId, p.ParentId, p.Title, p.Icon, p.Cover, p.Content, p.IsFavorite, p.IsArchived, p.IsPublic, p.CreatedById, p.LastEditedById, p.CreatedAt, p.UpdatedAt, p.LastOpenedAt);
}
