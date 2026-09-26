using NotionClone.Application.DTOs.Search;

namespace NotionClone.Application.Interfaces;

public interface ISearchService
{
    Task<IEnumerable<SearchResultDto>> SearchPagesAsync(Guid userId, Guid workspaceId, string query, CancellationToken ct = default);
}
