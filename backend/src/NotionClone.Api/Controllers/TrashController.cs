using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClone.Application.DTOs.Page;
using NotionClone.Application.Interfaces;

namespace NotionClone.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/trash")]
public class TrashController : ApiControllerBase
{
    private readonly IPageService _pageService;

    public TrashController(IPageService pageService)
    {
        _pageService = pageService;
    }

    /// <summary>Get all trashed / archived pages in a workspace.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetTrash([FromQuery] Guid workspaceId, CancellationToken ct)
    {
        var trashPages = await _pageService.GetTrashPagesAsync(CurrentUserId, workspaceId, ct);
        return Ok(trashPages);
    }

    /// <summary>Restore a page from trash.</summary>
    [HttpPost("{pageId:guid}/restore")]
    [ProducesResponseType(typeof(PageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Restore(Guid pageId, CancellationToken ct)
    {
        var page = await _pageService.RestorePageAsync(CurrentUserId, pageId, ct);
        return Ok(page);
    }

    /// <summary>Permanently delete a page and its descendants from trash.</summary>
    [HttpDelete("{pageId:guid}/permanent")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PermanentDelete(Guid pageId, CancellationToken ct)
    {
        await _pageService.PermanentDeletePageAsync(CurrentUserId, pageId, ct);
        return NoContent();
    }

    /// <summary>Empty all trashed pages in a workspace.</summary>
    [HttpDelete("empty")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> EmptyTrash([FromQuery] Guid workspaceId, CancellationToken ct)
    {
        await _pageService.EmptyTrashAsync(CurrentUserId, workspaceId, ct);
        return NoContent();
    }
}
