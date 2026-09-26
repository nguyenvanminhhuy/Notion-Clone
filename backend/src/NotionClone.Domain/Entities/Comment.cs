using NotionClone.Domain.Common;

namespace NotionClone.Domain.Entities;

public class Comment : BaseEntity
{
    public Guid PageId { get; set; }
    public Guid UserId { get; set; }
    public Guid? ParentId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsResolved { get; set; } = false;

    public Page Page { get; set; } = null!;
    public User User { get; set; } = null!;
    public Comment? ParentComment { get; set; }
    public ICollection<Comment> Replies { get; set; } = new List<Comment>();
}
