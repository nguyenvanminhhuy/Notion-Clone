using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClone.Application.DTOs.Page;
using NotionClone.Application.Interfaces;

namespace NotionClone.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/favorites")]
public class FavoritesController : ApiControllerBase
{
    private readonly IPageService _pageService;

    public FavoritesController(IPageService pageService)
    {
        _pageService = pageService;
    }

    /// <summary>Get all favorited pages in a workspace.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetFavorites([FromQuery] Guid workspaceId, CancellationToken ct)
    {
        var favorites = await _pageService.GetFavoritePagesAsync(CurrentUserId, workspaceId, ct);
        return Ok(favorites);
    }

    /// <summary>Add page to favorites (or toggle favorite).</summary>
    [HttpPost("{pageId:guid}")]
    [ProducesResponseType(typeof(PageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddFavorite(Guid pageId, CancellationToken ct)
    {
        var page = await _pageService.ToggleFavoriteAsync(CurrentUserId, pageId, ct);
        return Ok(page);
    }

    /// <summary>Remove page from favorites.</summary>
    [HttpDelete("{pageId:guid}")]
    [ProducesResponseType(typeof(PageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveFavorite(Guid pageId, CancellationToken ct)
    {
        var page = await _pageService.RemoveFavoriteAsync(CurrentUserId, pageId, ct);
        return Ok(page);
    }
}
