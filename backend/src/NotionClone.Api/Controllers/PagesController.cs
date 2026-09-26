using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClone.Application.DTOs.Page;
using NotionClone.Application.Interfaces;

namespace NotionClone.Api.Controllers;

[Authorize]
[ApiController]
public class PagesController : ApiControllerBase
{
    private readonly IPageService _pageService;

    public PagesController(IPageService pageService)
    {
        _pageService = pageService;
    }

    /// <summary>Get all active pages for a workspace (flat list).</summary>
    [HttpGet("api/workspaces/{workspaceId:guid}/pages")]
    [ProducesResponseType(typeof(IEnumerable<PageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetWorkspacePages(Guid workspaceId, CancellationToken ct)
    {
        var pages = await _pageService.GetWorkspacePagesAsync(CurrentUserId, workspaceId, ct);
        return Ok(pages);
    }

    /// <summary>Get workspace page tree hierarchy.</summary>
    [HttpGet("api/workspaces/{workspaceId:guid}/pages/tree")]
    [ProducesResponseType(typeof(IEnumerable<PageTreeItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetWorkspacePageTree(Guid workspaceId, CancellationToken ct)
    {
        var tree = await _pageService.GetWorkspacePageTreeAsync(CurrentUserId, workspaceId, ct);
        return Ok(tree);
    }

    /// <summary>Create a new page in a workspace.</summary>
    [HttpPost("api/workspaces/{workspaceId:guid}/pages")]
    [ProducesResponseType(typeof(PageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreatePage(Guid workspaceId, [FromBody] CreatePageRequest request, CancellationToken ct)
    {
        var page = await _pageService.CreatePageAsync(CurrentUserId, workspaceId, request, ct);
        return CreatedAtAction(nameof(GetPage), new { id = page.Id }, page);
    }

    /// <summary>Get page details by ID.</summary>
    [HttpGet("api/pages/{id:guid}")]
    [ProducesResponseType(typeof(PageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPage(Guid id, CancellationToken ct)
    {
        var page = await _pageService.GetPageByIdAsync(CurrentUserId, id, ct);
        return Ok(page);
    }

    /// <summary>Update page metadata.</summary>
    [HttpPatch("api/pages/{id:guid}")]
    [ProducesResponseType(typeof(PageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePage(Guid id, [FromBody] UpdatePageRequest request, CancellationToken ct)
    {
        var page = await _pageService.UpdatePageAsync(CurrentUserId, id, request, ct);
        return Ok(page);
    }

    /// <summary>Move page to a new parent.</summary>
    [HttpPatch("api/pages/{id:guid}/move")]
    [ProducesResponseType(typeof(PageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MovePage(Guid id, [FromBody] MovePageRequest request, CancellationToken ct)
    {
        var page = await _pageService.MovePageAsync(CurrentUserId, id, request, ct);
        return Ok(page);
    }

    /// <summary>Soft delete page (move to trash).</summary>
    [HttpDelete("api/pages/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SoftDeletePage(Guid id, CancellationToken ct)
    {
        await _pageService.SoftDeletePageAsync(CurrentUserId, id, ct);
        return NoContent();
    }

    /// <summary>Restore soft deleted page from trash.</summary>
    [HttpPost("api/pages/{id:guid}/restore")]
    [ProducesResponseType(typeof(PageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RestorePage(Guid id, CancellationToken ct)
    {
        var page = await _pageService.RestorePageAsync(CurrentUserId, id, ct);
        return Ok(page);
    }

    /// <summary>Permanently delete page and all descendants.</summary>
    [HttpDelete("api/pages/{id:guid}/permanent")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PermanentDeletePage(Guid id, CancellationToken ct)
    {
        await _pageService.PermanentDeletePageAsync(CurrentUserId, id, ct);
        return NoContent();
    }

    /// <summary>Duplicate page and its entire subtree.</summary>
    [HttpPost("api/pages/{id:guid}/duplicate")]
    [ProducesResponseType(typeof(PageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DuplicatePage(Guid id, CancellationToken ct)
    {
        var page = await _pageService.DuplicatePageAsync(CurrentUserId, id, ct);
        return CreatedAtAction(nameof(GetPage), new { id = page.Id }, page);
    }

    /// <summary>Toggle favorite status of a page.</summary>
    [HttpPost("api/pages/{id:guid}/favorite")]
    [ProducesResponseType(typeof(PageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleFavorite(Guid id, CancellationToken ct)
    {
        var page = await _pageService.ToggleFavoriteAsync(CurrentUserId, id, ct);
        return Ok(page);
    }

    /// <summary>Record last opened timestamp for a page.</summary>
    [HttpPost("api/pages/{id:guid}/record-open")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordOpen(Guid id, CancellationToken ct)
    {
        await _pageService.RecordOpenAsync(CurrentUserId, id, ct);
        return NoContent();
    }

    /// <summary>Get Tiptap JSON content of a page.</summary>
    [HttpGet("api/pages/{id:guid}/content")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPageContent(Guid id, CancellationToken ct)
    {
        var content = await _pageService.GetPageContentAsync(CurrentUserId, id, ct);
        return Content(content, "application/json");
    }

    /// <summary>Save Tiptap JSON content of a page.</summary>
    [HttpPut("api/pages/{id:guid}/content")]
    [ProducesResponseType(typeof(PageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePageContent(Guid id, [FromBody] UpdatePageContentRequest request, CancellationToken ct)
    {
        var page = await _pageService.UpdatePageContentAsync(CurrentUserId, id, request, ct);
        return Ok(page);
    }
}
