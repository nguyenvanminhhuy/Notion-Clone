using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClone.Application.DTOs.AI;
using NotionClone.Application.Interfaces;

namespace NotionClone.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/ai")]
public class AiController : ApiControllerBase
{
    private readonly IAiService _aiService;

    public AiController(IAiService aiService)
    {
        _aiService = aiService;
    }

    /// <summary>Generate AI transformations on content (summarize, improve, rewrite, etc.).</summary>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(AiGenerateResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Generate([FromBody] AiGenerateRequest request, CancellationToken ct)
    {
        var result = await _aiService.GenerateAsync(CurrentUserId, request, ct);
        return Ok(result);
    }

    /// <summary>Send a message in an AI conversation.</summary>
    [HttpPost("chat")]
    [ProducesResponseType(typeof(AIMessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Chat([FromBody] AiChatRequest request, CancellationToken ct)
    {
        var result = await _aiService.ChatAsync(CurrentUserId, request, ct);
        return Ok(result);
    }

    /// <summary>Get user's AI conversations (optionally filtered by page).</summary>
    [HttpGet("conversations")]
    [ProducesResponseType(typeof(IEnumerable<AIConversationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConversations([FromQuery] Guid? pageId, CancellationToken ct)
    {
        var conversations = await _aiService.GetConversationsAsync(CurrentUserId, pageId, ct);
        return Ok(conversations);
    }

    /// <summary>Create a new AI conversation.</summary>
    [HttpPost("conversations")]
    [ProducesResponseType(typeof(AIConversationDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateConversation([FromBody] CreateConversationRequest request, CancellationToken ct)
    {
        var conversation = await _aiService.CreateConversationAsync(CurrentUserId, request, ct);
        return CreatedAtAction(nameof(GetConversation), new { id = conversation.Id }, conversation);
    }

    /// <summary>Get an AI conversation with message history.</summary>
    [HttpGet("conversations/{id:guid}")]
    [ProducesResponseType(typeof(AIConversationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConversation(Guid id, CancellationToken ct)
    {
        var conversation = await _aiService.GetConversationByIdAsync(CurrentUserId, id, ct);
        return Ok(conversation);
    }

    /// <summary>Delete an AI conversation.</summary>
    [HttpDelete("conversations/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteConversation(Guid id, CancellationToken ct)
    {
        await _aiService.DeleteConversationAsync(CurrentUserId, id, ct);
        return NoContent();
    }
}
