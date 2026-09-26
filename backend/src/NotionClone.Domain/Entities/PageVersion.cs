using NotionClone.Domain.Common;

namespace NotionClone.Domain.Entities;

public class PageVersion : BaseEntity
{
    public Guid PageId { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid EditedById { get; set; }

    public Page Page { get; set; } = null!;
    public User EditedBy { get; set; } = null!;
}
