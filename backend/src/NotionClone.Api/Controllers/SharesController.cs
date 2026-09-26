using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClone.Application.DTOs.Page;
using NotionClone.Application.DTOs.Share;
using NotionClone.Application.Interfaces;

namespace NotionClone.Api.Controllers;

[Authorize]
[ApiController]
public class SharesController : ApiControllerBase
{
    private readonly IShareService _shareService;

    public SharesController(IShareService shareService)
    {
        _shareService = shareService;
    }

    /// <summary>Get all share permissions for a page.</summary>
    [HttpGet("api/pages/{pageId:guid}/shares")]
    [ProducesResponseType(typeof(IEnumerable<PageShareDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPageShares(Guid pageId, CancellationToken ct)
    {
        var shares = await _shareService.GetPageSharesAsync(CurrentUserId, pageId, ct);
        return Ok(shares);
    }

    /// <summary>Share a page with a user or email.</summary>
    [HttpPost("api/pages/{pageId:guid}/shares")]
    [ProducesResponseType(typeof(PageShareDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SharePage(Guid pageId, [FromBody] CreateShareRequest request, CancellationToken ct)
    {
        var share = await _shareService.SharePageAsync(CurrentUserId, pageId, request, ct);
        return CreatedAtAction(nameof(GetPageShares), new { pageId }, share);
    }

    /// <summary>Update a share permission role.</summary>
    [HttpPatch("api/shares/{shareId:guid}")]
    [ProducesResponseType(typeof(PageShareDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateShareRole(Guid shareId, [FromBody] UpdateShareRoleRequest request, CancellationToken ct)
    {
        var share = await _shareService.UpdateShareRoleAsync(CurrentUserId, shareId, request, ct);
        return Ok(share);
    }

    /// <summary>Revoke a page share permission.</summary>
    [HttpDelete("api/shares/{shareId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveShare(Guid shareId, CancellationToken ct)
    {
        await _shareService.RemoveShareAsync(CurrentUserId, shareId, ct);
        return NoContent();
    }

    /// <summary>Toggle public web access for a page.</summary>
    [HttpPost("api/pages/{pageId:guid}/public")]
    [ProducesResponseType(typeof(PageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TogglePublicAccess(Guid pageId, [FromBody] TogglePublicAccessRequest request, CancellationToken ct)
    {
        var page = await _shareService.TogglePublicAccessAsync(CurrentUserId, pageId, request, ct);
        return Ok(page);
    }

    /// <summary>Get public page content (anonymous access).</summary>
    [AllowAnonymous]
    [HttpGet("api/public/pages/{pageId:guid}")]
    [ProducesResponseType(typeof(PageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPublicPage(Guid pageId, CancellationToken ct)
    {
        var page = await _shareService.GetPublicPageAsync(pageId, ct);
        return Ok(page);
    }
}
