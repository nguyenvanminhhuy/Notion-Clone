using System.Text;
using Microsoft.EntityFrameworkCore;
using NotionClone.Application.Interfaces;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;
using NotionClone.Infrastructure.Services;
using Xunit;

namespace NotionClone.UnitTests;

public class MockFileStorageService : IFileStorageService
{
    private readonly Dictionary<string, byte[]> _storage = new();

    public Task<(string storageKey, string url)> SaveFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default)
    {
        var key = Guid.NewGuid().ToString("N") + Path.GetExtension(fileName);
        using var ms = new MemoryStream();
        fileStream.CopyTo(ms);
        _storage[key] = ms.ToArray();
        return Task.FromResult((key, $"/api/files/{key}/download"));
    }

    public Task<Stream?> GetFileAsync(string storageKey, CancellationToken ct = default)
    {
        if (_storage.TryGetValue(storageKey, out var bytes))
        {
            return Task.FromResult<Stream?>(new MemoryStream(bytes));
        }
        return Task.FromResult<Stream?>(null);
    }

    public Task DeleteFileAsync(string storageKey, CancellationToken ct = default)
    {
        _storage.Remove(storageKey);
        return Task.CompletedTask;
    }
}

public class FileManagementTests
{
    private NotionDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<NotionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new NotionDbContext(options);
    }

    private async Task<(Guid userId, Guid workspaceId, Guid pageId)> SetupPageAsync(NotionDbContext db)
    {
        var userId = Guid.NewGuid();
        var workspaceId = Guid.NewGuid();
        var pageId = Guid.NewGuid();

        var user = new User { Id = userId, Email = "fileuser@example.com", Name = "File User" };
        var workspace = new Workspace { Id = workspaceId, Name = "File Workspace", Slug = "file-workspace" };
        var member = new WorkspaceMember { Id = Guid.NewGuid(), WorkspaceId = workspaceId, UserId = userId, Role = UserRole.Owner };
        var page = new Page
        {
            Id = pageId,
            WorkspaceId = workspaceId,
            Title = "File Test Doc",
            Content = "{}",
            CreatedById = userId,
            LastEditedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        db.Workspaces.Add(workspace);
        db.WorkspaceMembers.Add(member);
        db.Pages.Add(page);
        await db.SaveChangesAsync();

        return (userId, workspaceId, pageId);
    }

    [Fact]
    public async Task UploadDownloadAndDeleteFile_ShouldSucceed()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, _, pageId) = await SetupPageAsync(db);
        var storage = new MockFileStorageService();
        var fileService = new FileService(db, storage);

        var fileContent = "Hello Notion File Storage!";
        var fileBytes = Encoding.UTF8.GetBytes(fileContent);

        // Act 1: Upload
        using var uploadStream = new MemoryStream(fileBytes);
        var uploaded = await fileService.UploadFileAsync(userId, pageId, uploadStream, "test.txt", "text/plain", fileBytes.Length);

        Assert.NotNull(uploaded);
        Assert.Equal("test.txt", uploaded.Name);
        Assert.Equal(pageId, uploaded.PageId);

        // Act 2: Download
        var (downloadStream, contentType, fileName) = await fileService.DownloadFileAsync(userId, uploaded.Id);
        Assert.Equal("text/plain", contentType);
        Assert.Equal("test.txt", fileName);

        using var sr = new StreamReader(downloadStream);
        var downloadedText = await sr.ReadToEndAsync();
        Assert.Equal(fileContent, downloadedText);

        // Act 3: List files
        var pageFiles = (await fileService.GetPageFilesAsync(userId, pageId)).ToList();
        Assert.Single(pageFiles);
        Assert.Equal(uploaded.Id, pageFiles[0].Id);

        // Act 4: Delete
        await fileService.DeleteFileAsync(userId, uploaded.Id);
        var pageFilesAfter = (await fileService.GetPageFilesAsync(userId, pageId)).ToList();
        Assert.Empty(pageFilesAfter);
    }
}
