using NotionClone.Application.DTOs.AI;

namespace NotionClone.Application.Interfaces;

public interface IAiService
{
    Task<AiGenerateResponse> GenerateAsync(Guid userId, AiGenerateRequest request, CancellationToken ct = default);
    Task<AIMessageDto> ChatAsync(Guid userId, AiChatRequest request, CancellationToken ct = default);
    Task<IEnumerable<AIConversationDto>> GetConversationsAsync(Guid userId, Guid? pageId = null, CancellationToken ct = default);
    Task<AIConversationDto> GetConversationByIdAsync(Guid userId, Guid conversationId, CancellationToken ct = default);
    Task<AIConversationDto> CreateConversationAsync(Guid userId, CreateConversationRequest request, CancellationToken ct = default);
    Task DeleteConversationAsync(Guid userId, Guid conversationId, CancellationToken ct = default);
}
