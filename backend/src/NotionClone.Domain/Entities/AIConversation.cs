using NotionClone.Domain.Common;

namespace NotionClone.Domain.Entities;

public class AIConversation : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid? PageId { get; set; }
    public string? Title { get; set; }

    public User User { get; set; } = null!;
    public Page? Page { get; set; }
    public ICollection<AIMessage> Messages { get; set; } = new List<AIMessage>();
}
