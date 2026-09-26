namespace NotionClone.Application.Interfaces;

public interface IFileStorageService
{
    Task<(string storageKey, string url)> SaveFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default);
    Task<Stream?> GetFileAsync(string storageKey, CancellationToken ct = default);
    Task DeleteFileAsync(string storageKey, CancellationToken ct = default);
}
