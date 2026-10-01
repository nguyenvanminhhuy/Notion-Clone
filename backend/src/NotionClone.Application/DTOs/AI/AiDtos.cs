namespace NotionClone.Application.DTOs.AI;

public record AIMessageDto(
    Guid Id,
    Guid ConversationId,
    string Role,
    string Content,
    string? ActionType,
    DateTime CreatedAt
);

public record AIConversationDto(
    Guid Id,
    Guid? PageId,
    string? Title,
    List<AIMessageDto> Messages,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record AiGenerateRequest(
    string Prompt,
    string? ContextText,
    string? ActionType,
    Guid? PageId
);

public record AiGenerateResponse(
    string Response,
    string ActionType
);

public record AiChatRequest(
    Guid? ConversationId,
    Guid? PageId,
    string Message,
    string? ActionType
);

public record CreateConversationRequest(
    Guid? PageId,
    string? Title
);
