using NotionClone.Application.DTOs.File;

namespace NotionClone.Application.Interfaces;

public interface IFileService
{
    Task<FileAttachmentDto> UploadFileAsync(Guid userId, Guid pageId, Stream fileStream, string fileName, string contentType, long sizeBytes, CancellationToken ct = default);
    Task<(Stream stream, string contentType, string fileName)> DownloadFileAsync(Guid userId, Guid fileId, CancellationToken ct = default);
    Task<FileAttachmentDto> GetFileMetadataAsync(Guid userId, Guid fileId, CancellationToken ct = default);
    Task<IEnumerable<FileAttachmentDto>> GetPageFilesAsync(Guid userId, Guid pageId, CancellationToken ct = default);
    Task DeleteFileAsync(Guid userId, Guid fileId, CancellationToken ct = default);
}
