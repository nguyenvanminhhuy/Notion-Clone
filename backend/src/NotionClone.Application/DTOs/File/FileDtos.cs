namespace NotionClone.Application.DTOs.File;

public record FileAttachmentDto(
    Guid Id,
    Guid PageId,
    string Name,
    string Url,
    long SizeBytes,
    string MimeType,
    Guid UploadedById,
    DateTime CreatedAt
);

public record FileUploadResponse(
    Guid Id,
    Guid PageId,
    string Name,
    string Url,
    long SizeBytes,
    string MimeType
);
