using NotionClone.Domain.Common;
using NotionClone.Domain.Enums;

namespace NotionClone.Domain.Entities;

public class Workspace : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? IconEmoji { get; set; }
    public string? IconUrl { get; set; }
    public WorkspacePlan Plan { get; set; } = WorkspacePlan.Free;

    public ICollection<WorkspaceMember> Members { get; set; } = new List<WorkspaceMember>();
    public ICollection<Page> Pages { get; set; } = new List<Page>();
}
