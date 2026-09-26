using NotionClone.Domain.Common;

namespace NotionClone.Domain.Entities;

public class UserSettings : BaseEntity
{
    public Guid UserId { get; set; }
    public string Theme { get; set; } = "system";
    public string FontSize { get; set; } = "md";
    public string LineHeight { get; set; } = "normal";
    public bool FullWidth { get; set; } = false;
    public bool AiEnabled { get; set; } = true;
    public string AiModel { get; set; } = "gpt-4o";
    public string AiResponseStyle { get; set; } = "balanced";

    public User? User { get; set; }
}
