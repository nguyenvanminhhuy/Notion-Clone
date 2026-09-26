using NotionClone.Domain.Common;
using NotionClone.Domain.Enums;

namespace NotionClone.Domain.Entities;

public class AIMessage : BaseEntity
{
    public Guid ConversationId { get; set; }
    public AIRole Role { get; set; } = AIRole.User;
    public string Content { get; set; } = string.Empty;
    public string? ActionType { get; set; }

    public AIConversation Conversation { get; set; } = null!;
}
