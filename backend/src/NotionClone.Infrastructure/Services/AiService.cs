using Microsoft.EntityFrameworkCore;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.AI;
using NotionClone.Application.Interfaces;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Infrastructure.Services;

public class AiService : IAiService
{
    private const int MaxPromptLength = 4_000;
    private const int MaxContextLength = 20_000;
    private const int MaxOutputLength = 8_000;
    private readonly TimeSpan _providerTimeout;
    private readonly NotionDbContext _dbContext;
    private readonly IAiEngine _aiEngine;
    private readonly IPageAuthorizationService _authorization;

    public AiService(NotionDbContext dbContext, IAiEngine aiEngine, IPageAuthorizationService? authorization = null, TimeSpan? providerTimeout = null)
    {
        _dbContext = dbContext;
        _aiEngine = aiEngine;
        _authorization = authorization ?? new PageAuthorizationService(dbContext);
        _providerTimeout = providerTimeout ?? TimeSpan.FromSeconds(30);
    }

    public async Task<AiGenerateResponse> GenerateAsync(Guid userId, AiGenerateRequest request, CancellationToken ct = default)
    {
        ValidateInput(request.Prompt, nameof(request.Prompt));
        var context = await ResolveAuthorizedContextAsync(userId, request.PageId, request.ContextText, ct);
        var action = string.IsNullOrWhiteSpace(request.ActionType) ? "custom" : request.ActionType;
        var responseText = await GenerateWithTimeoutAsync(request.Prompt, context, action, ct);

        return new AiGenerateResponse(LimitOutput(responseText), action);
    }

    public async Task<AIMessageDto> ChatAsync(Guid userId, AiChatRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            throw new ValidationException("Message cannot be empty.");
        }
        ValidateInput(request.Message, nameof(request.Message));

        AIConversation conversation;
        if (request.ConversationId.HasValue)
        {
            conversation = await _dbContext.AIConversations
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.Id == request.ConversationId.Value && c.UserId == userId, ct)
                ?? throw new NotFoundException($"Conversation with ID '{request.ConversationId.Value}' was not found.");

            if (conversation.PageId.HasValue)
                await _authorization.EnsurePagePermissionAsync(userId, conversation.PageId.Value, PagePermission.Read, ct);
            if (conversation.Messages.Count >= 100)
                throw new ValidationException("AI conversations are limited to 100 messages. Start a new conversation.");
        }
        else
        {
            if (request.PageId.HasValue)
                await _authorization.EnsurePagePermissionAsync(userId, request.PageId.Value, PagePermission.Read, ct);
            var title = request.Message.Length > 30 ? request.Message[..30] + "..." : request.Message;
            conversation = new AIConversation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PageId = request.PageId,
                Title = title,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.AIConversations.Add(conversation);
        }

        var userMessage = new AIMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            Role = AIRole.User,
            Content = request.Message.Trim(),
            ActionType = request.ActionType,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var action = string.IsNullOrWhiteSpace(request.ActionType) ? "custom" : request.ActionType;
        var pageId = conversation.PageId ?? request.PageId;
        var context = await ResolveAuthorizedContextAsync(userId, pageId, null, ct);
        var responseText = LimitOutput(await GenerateWithTimeoutAsync(request.Message, context, action, ct));

        var assistantMessage = new AIMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            Role = AIRole.Assistant,
            Content = responseText,
            ActionType = action,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        conversation.UpdatedAt = DateTime.UtcNow;
        _dbContext.AIMessages.AddRange(userMessage, assistantMessage);
        await _dbContext.SaveChangesAsync(ct);

        return MapToAIMessageDto(assistantMessage);
    }

    public async Task<IEnumerable<AIConversationDto>> GetConversationsAsync(Guid userId, Guid? pageId = null, CancellationToken ct = default)
    {
        if (pageId.HasValue)
            await _authorization.EnsurePagePermissionAsync(userId, pageId.Value, PagePermission.Read, ct);
        var query = _dbContext.AIConversations
            .AsNoTracking()
            .Include(c => c.Messages)
            .Where(c => c.UserId == userId);

        if (pageId.HasValue)
        {
            query = query.Where(c => c.PageId == pageId.Value);
        }

        var conversations = await query
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(ct);

        return conversations.Select(MapToAIConversationDto);
    }

    public async Task<AIConversationDto> GetConversationByIdAsync(Guid userId, Guid conversationId, CancellationToken ct = default)
    {
        var conversation = await _dbContext.AIConversations
            .AsNoTracking()
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, ct)
            ?? throw new NotFoundException($"Conversation with ID '{conversationId}' was not found.");

        if (conversation.PageId.HasValue)
            await _authorization.EnsurePagePermissionAsync(userId, conversation.PageId.Value, PagePermission.Read, ct);

        return MapToAIConversationDto(conversation);
    }

    public async Task<AIConversationDto> CreateConversationAsync(Guid userId, CreateConversationRequest request, CancellationToken ct = default)
    {
        if (request.PageId.HasValue)
            await _authorization.EnsurePagePermissionAsync(userId, request.PageId.Value, PagePermission.Read, ct);
        var conversation = new AIConversation
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PageId = request.PageId,
            Title = string.IsNullOrWhiteSpace(request.Title) ? "New Conversation" : request.Title.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.AIConversations.Add(conversation);
        await _dbContext.SaveChangesAsync(ct);

        return MapToAIConversationDto(conversation);
    }

    public async Task DeleteConversationAsync(Guid userId, Guid conversationId, CancellationToken ct = default)
    {
        var conversation = await _dbContext.AIConversations
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, ct)
            ?? throw new NotFoundException($"Conversation with ID '{conversationId}' was not found.");

        _dbContext.AIConversations.Remove(conversation);
        await _dbContext.SaveChangesAsync(ct);
    }

    private static AIMessageDto MapToAIMessageDto(AIMessage m) =>
        new(
            m.Id,
            m.ConversationId,
            m.Role.ToString().ToLowerInvariant(),
            m.Content,
            m.ActionType,
            m.CreatedAt
        );

    private static AIConversationDto MapToAIConversationDto(AIConversation c) =>
        new(
            c.Id,
            c.PageId,
            c.Title,
            c.Messages.OrderBy(m => m.CreatedAt).Select(MapToAIMessageDto).ToList(),
            c.CreatedAt,
            c.UpdatedAt
        );

    private async Task<string?> ResolveAuthorizedContextAsync(
        Guid userId,
        Guid? pageId,
        string? clientContext,
        CancellationToken ct)
    {
        if (pageId.HasValue)
        {
            await _authorization.EnsurePagePermissionAsync(userId, pageId.Value, PagePermission.Read, ct);
            var content = await _dbContext.Pages
                .AsNoTracking()
                .Where(page => page.Id == pageId.Value)
                .Select(page => page.Content)
                .SingleAsync(ct);
            if (content.Length > MaxContextLength)
                throw new ValidationException($"AI page context cannot exceed {MaxContextLength} characters.");
            return content;
        }

        if (clientContext?.Length > MaxContextLength)
            throw new ValidationException($"AI context cannot exceed {MaxContextLength} characters.");

        return clientContext;
    }

    private async Task<string> GenerateWithTimeoutAsync(string prompt, string? context, string action, CancellationToken ct)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(_providerTimeout);
        try
        {
            var response = await _aiEngine.GenerateAsync(prompt, context, action, timeout.Token)
                .WaitAsync(timeout.Token);
            if (string.IsNullOrWhiteSpace(response))
                throw new ExternalServiceException("The AI provider returned an empty response.");
            return response;
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            throw new ExternalServiceException("The AI provider timed out.");
        }
        catch (ExternalServiceException)
        {
            throw;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception)
        {
            throw new ExternalServiceException("The AI provider request failed.");
        }
    }

    private static void ValidateInput(string value, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ValidationException(field, "AI input is required.");
        if (value.Length > MaxPromptLength)
            throw new ValidationException(field, $"AI input cannot exceed {MaxPromptLength} characters.");
    }

    private static string LimitOutput(string response) =>
        response.Length <= MaxOutputLength ? response : response[..MaxOutputLength];
}
