using NotionClone.Domain.Common;

namespace NotionClone.Domain.Entities;

public class Page : BaseEntity
{
    public Guid WorkspaceId { get; set; }
    public Guid? ParentId { get; set; }
    public string Title { get; set; } = "Untitled";
    public string? Icon { get; set; }
    public string? Cover { get; set; }
    public string Content { get; set; } = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\"}]}";
    public bool IsFavorite { get; set; } = false;
    public bool IsArchived { get; set; } = false;
    public bool IsPublic { get; set; } = false;
    public Guid CreatedById { get; set; }
    public Guid LastEditedById { get; set; }
    public DateTime? LastOpenedAt { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public Page? ParentPage { get; set; }
    public ICollection<Page> ChildPages { get; set; } = new List<Page>();
    public User CreatedBy { get; set; } = null!;
    public User LastEditedBy { get; set; } = null!;
    public ICollection<PageVersion> Versions { get; set; } = new List<PageVersion>();
    public ICollection<PageShare> Shares { get; set; } = new List<PageShare>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<FileAttachment> Attachments { get; set; } = new List<FileAttachment>();
}
