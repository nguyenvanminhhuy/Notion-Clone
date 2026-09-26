using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClone.Application.DTOs.Search;
using NotionClone.Application.Interfaces;

namespace NotionClone.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/search")]
public class SearchController : ApiControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    /// <summary>Search pages within a workspace by title and content.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<SearchResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] Guid workspaceId, CancellationToken ct)
    {
        var results = await _searchService.SearchPagesAsync(CurrentUserId, workspaceId, q ?? string.Empty, ct);
        return Ok(results);
    }
}
