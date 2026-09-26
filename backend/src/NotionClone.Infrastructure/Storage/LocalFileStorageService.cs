using Microsoft.AspNetCore.Hosting;
using NotionClone.Application.Interfaces;

namespace NotionClone.Infrastructure.Storage;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _storageFolder;

    public LocalFileStorageService(IWebHostEnvironment environment)
    {
        _storageFolder = Path.Combine(environment.ContentRootPath, "uploads");
        if (!Directory.Exists(_storageFolder))
        {
            Directory.CreateDirectory(_storageFolder);
        }
    }

    public async Task<(string storageKey, string url)> SaveFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default)
    {
        var ext = Path.GetExtension(fileName);
        var storageKey = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(_storageFolder, storageKey);

        using (var outputStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await fileStream.CopyToAsync(outputStream, ct);
        }

        var url = $"/api/files/{storageKey}/download";
        return (storageKey, url);
    }

    public Task<Stream?> GetFileAsync(string storageKey, CancellationToken ct = default)
    {
        var filePath = Path.Combine(_storageFolder, storageKey);
        if (!File.Exists(filePath))
        {
            return Task.FromResult<Stream?>(null);
        }

        Stream stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult<Stream?>(stream);
    }

    public Task DeleteFileAsync(string storageKey, CancellationToken ct = default)
    {
        var filePath = Path.Combine(_storageFolder, storageKey);
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
        return Task.CompletedTask;
    }
}
