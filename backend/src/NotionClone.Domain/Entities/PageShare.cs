using NotionClone.Domain.Common;
using NotionClone.Domain.Enums;

namespace NotionClone.Domain.Entities;

public class PageShare : BaseEntity
{
    public Guid PageId { get; set; }
    public Guid? UserId { get; set; }
    public string? Email { get; set; }
    public PageRole Role { get; set; } = PageRole.Viewer;

    public Page Page { get; set; } = null!;
    public User? User { get; set; }
}
