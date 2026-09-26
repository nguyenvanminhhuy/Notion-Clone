using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.Page;
using NotionClone.Application.DTOs.Search;
using NotionClone.Application.Interfaces;
using NotionClone.Domain.Entities;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Infrastructure.Services;

public class SearchService : ISearchService
{
    private readonly NotionDbContext _dbContext;

    public SearchService(NotionDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<SearchResultDto>> SearchPagesAsync(Guid userId, Guid workspaceId, string query, CancellationToken ct = default)
    {
        await EnsureWorkspaceMemberAsync(userId, workspaceId, ct);

        var q = query?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(q))
        {
            return Enumerable.Empty<SearchResultDto>();
        }

        var activePages = await _dbContext.Pages
            .AsNoTracking()
            .Where(p => p.WorkspaceId == workspaceId && !p.IsArchived)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync(ct);

        var pageMap = activePages.ToDictionary(p => p.Id);

        List<string> GetBreadcrumbs(Page page)
        {
            var breadcrumbs = new List<string>();
            var curParentId = page.ParentId;
            while (curParentId.HasValue && pageMap.TryGetValue(curParentId.Value, out var parent))
            {
                breadcrumbs.Insert(0, string.IsNullOrWhiteSpace(parent.Title) ? "Untitled" : parent.Title);
                curParentId = parent.ParentId;
            }
            return breadcrumbs;
        }

        var results = new List<SearchResultDto>();

        foreach (var page in activePages)
        {
            var title = page.Title ?? string.Empty;
            var isTitleMatch = title.ToLowerInvariant().Contains(q);

            var pageDto = MapToPageDto(page);

            if (isTitleMatch)
            {
                results.Add(new SearchResultDto(
                    pageDto,
                    GetBreadcrumbs(page),
                    "title",
                    null
                ));
            }
            else
            {
                var text = ExtractPlainText(page.Content);
                var contentIndex = text.IndexOf(q, StringComparison.OrdinalIgnoreCase);

                if (contentIndex >= 0)
                {
                    var start = Math.Max(0, contentIndex - 30);
                    var end = Math.Min(text.Length, contentIndex + q.Length + 40);
                    var snippet = text.Substring(start, end - start);

                    if (start > 0) snippet = "…" + snippet;
                    if (end < text.Length) snippet = snippet + "…";

                    results.Add(new SearchResultDto(
                        pageDto,
                        GetBreadcrumbs(page),
                        "content",
                        snippet
                    ));
                }
            }
        }

        // Sort: title matches first, then content matches
        return results.OrderBy(r => r.MatchType == "title" ? 0 : 1);
    }

    private static string ExtractPlainText(string jsonContent)
    {
        if (string.IsNullOrWhiteSpace(jsonContent)) return string.Empty;

        try
        {
            using var doc = JsonDocument.Parse(jsonContent);
            var sb = new System.Text.StringBuilder();
            TraverseElement(doc.RootElement, sb);
            return sb.ToString().Trim();
        }
        catch
        {
            return jsonContent;
        }
    }

    private static void TraverseElement(JsonElement element, System.Text.StringBuilder sb)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            if (element.TryGetProperty("text", out var textProp) && textProp.ValueKind == JsonValueKind.String)
            {
                sb.Append(textProp.GetString()).Append(' ');
            }

            if (element.TryGetProperty("content", out var contentProp) && contentProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var child in contentProp.EnumerateArray())
                {
                    TraverseElement(child, sb);
                }
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                TraverseElement(item, sb);
            }
        }
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

    private static PageDto MapToPageDto(Page p) =>
        new(p.Id, p.WorkspaceId, p.ParentId, p.Title, p.Icon, p.Cover, p.Content, p.IsFavorite, p.IsArchived, p.IsPublic, p.CreatedById, p.LastEditedById, p.CreatedAt, p.UpdatedAt, p.LastOpenedAt);
}
