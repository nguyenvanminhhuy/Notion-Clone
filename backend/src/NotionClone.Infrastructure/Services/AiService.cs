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
    private readonly NotionDbContext _dbContext;
    private readonly IAiEngine _aiEngine;

    public AiService(NotionDbContext dbContext, IAiEngine aiEngine)
    {
        _dbContext = dbContext;
        _aiEngine = aiEngine;
    }

    public async Task<AiGenerateResponse> GenerateAsync(Guid userId, AiGenerateRequest request, CancellationToken ct = default)
    {
        var action = string.IsNullOrWhiteSpace(request.ActionType) ? "custom" : request.ActionType;
        var responseText = await _aiEngine.GenerateAsync(request.Prompt, request.ContextText, action, ct);

        return new AiGenerateResponse(responseText, action);
    }

    public async Task<AIMessageDto> ChatAsync(Guid userId, AiChatRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            throw new ValidationException("Message cannot be empty.");
        }

        AIConversation conversation;
        if (request.ConversationId.HasValue)
        {
            conversation = await _dbContext.AIConversations
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.Id == request.ConversationId.Value && c.UserId == userId, ct)
                ?? throw new NotFoundException($"Conversation with ID '{request.ConversationId.Value}' was not found.");
        }
        else
        {
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
        var responseText = await _aiEngine.GenerateAsync(request.Message, null, action, ct);

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

        return MapToAIConversationDto(conversation);
    }

    public async Task<AIConversationDto> CreateConversationAsync(Guid userId, CreateConversationRequest request, CancellationToken ct = default)
    {
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
}
