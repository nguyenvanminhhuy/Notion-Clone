using NotionClone.Domain.Common;

namespace NotionClone.Domain.Entities;

public class FileAttachment : BaseEntity
{
    public Guid PageId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string StorageKey { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public Guid UploadedById { get; set; }

    public Page Page { get; set; } = null!;
    public User UploadedBy { get; set; } = null!;
}
