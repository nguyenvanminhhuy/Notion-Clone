using NotionClone.Application.DTOs.Page;

namespace NotionClone.Application.DTOs.Search;

public record SearchResultDto(
    PageDto Page,
    List<string> Breadcrumbs,
    string MatchType,
    string? Snippet
);
