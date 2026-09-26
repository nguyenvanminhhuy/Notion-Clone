using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClone.Application.DTOs.Comment;
using NotionClone.Application.Interfaces;

namespace NotionClone.Api.Controllers;

[Authorize]
[ApiController]
public class CommentsController : ApiControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    /// <summary>Get all comments and nested replies for a page.</summary>
    [HttpGet("api/pages/{pageId:guid}/comments")]
    [ProducesResponseType(typeof(IEnumerable<CommentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPageComments(Guid pageId, CancellationToken ct)
    {
        var comments = await _commentService.GetPageCommentsAsync(CurrentUserId, pageId, ct);
        return Ok(comments);
    }

    /// <summary>Create a top-level comment on a page.</summary>
    [HttpPost("api/pages/{pageId:guid}/comments")]
    [ProducesResponseType(typeof(CommentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateComment(Guid pageId, [FromBody] CreateCommentRequest request, CancellationToken ct)
    {
        var comment = await _commentService.CreateCommentAsync(CurrentUserId, pageId, request, ct);
        return CreatedAtAction(nameof(GetPageComments), new { pageId }, comment);
    }

    /// <summary>Reply to an existing comment.</summary>
    [HttpPost("api/comments/{commentId:guid}/reply")]
    [ProducesResponseType(typeof(CommentReplyDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReplyToComment(Guid commentId, [FromBody] ReplyCommentRequest request, CancellationToken ct)
    {
        var reply = await _commentService.ReplyToCommentAsync(CurrentUserId, commentId, request, ct);
        return Ok(reply);
    }

    /// <summary>Update a comment's content.</summary>
    [HttpPatch("api/comments/{commentId:guid}")]
    [ProducesResponseType(typeof(CommentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateComment(Guid commentId, [FromBody] UpdateCommentRequest request, CancellationToken ct)
    {
        var comment = await _commentService.UpdateCommentAsync(CurrentUserId, commentId, request, ct);
        return Ok(comment);
    }

    /// <summary>Toggle comment resolution status.</summary>
    [HttpPatch("api/comments/{commentId:guid}/resolve")]
    [ProducesResponseType(typeof(CommentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveComment(Guid commentId, CancellationToken ct)
    {
        var comment = await _commentService.ResolveCommentAsync(CurrentUserId, commentId, ct);
        return Ok(comment);
    }

    /// <summary>Delete a comment.</summary>
    [HttpDelete("api/comments/{commentId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteComment(Guid commentId, CancellationToken ct)
    {
        await _commentService.DeleteCommentAsync(CurrentUserId, commentId, ct);
        return NoContent();
    }
}
