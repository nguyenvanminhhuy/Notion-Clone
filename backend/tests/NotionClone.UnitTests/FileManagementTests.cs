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
    public static IEnumerable<object[]> ValidFileSignatures =>
    [
        ["sample.png", "image/png", new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00 }],
        ["sample.jpg", "image/jpeg", new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00 }],
        ["sample.pdf", "application/pdf", "%PDF-1.7\nTest"u8.ToArray()]
    ];

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

        var fileBytes = "%PDF-1.7\nTest PDF"u8.ToArray();

        // Act 1: Upload
        using var uploadStream = new MemoryStream(fileBytes);
        var uploaded = await fileService.UploadFileAsync(userId, pageId, uploadStream, "test.pdf", "application/pdf", fileBytes.Length);

        Assert.NotNull(uploaded);
        Assert.Equal("test.pdf", uploaded.Name);
        Assert.Equal(pageId, uploaded.PageId);

        // Act 2: Download
        var (downloadStream, contentType, fileName) = await fileService.DownloadFileAsync(userId, uploaded.Id);
        Assert.Equal("application/pdf", contentType);
        Assert.Equal("test.pdf", fileName);

        using var downloaded = new MemoryStream();
        await downloadStream.CopyToAsync(downloaded);
        Assert.Equal(fileBytes, downloaded.ToArray());

        // Act 3: List files
        var pageFiles = (await fileService.GetPageFilesAsync(userId, pageId)).ToList();
        Assert.Single(pageFiles);
        Assert.Equal(uploaded.Id, pageFiles[0].Id);

        // Act 4: Delete
        await fileService.DeleteFileAsync(userId, uploaded.Id);
        var pageFilesAfter = (await fileService.GetPageFilesAsync(userId, pageId)).ToList();
        Assert.Empty(pageFilesAfter);
    }

    [Fact]
    public async Task UploadFile_ExecutableRenamedAsPng_IsRejected()
    {
        await using var db = CreateInMemoryDbContext();
        var (userId, _, pageId) = await SetupPageAsync(db);
        var service = new FileService(db, new MockFileStorageService());
        using var stream = new MemoryStream(new byte[] { 0x4D, 0x5A, 0x90, 0x00 });

        await Assert.ThrowsAsync<NotionClone.Application.Common.Exceptions.ValidationException>(() =>
            service.UploadFileAsync(userId, pageId, stream, "malware.png", "image/png", stream.Length));
    }

    [Fact]
    public async Task UploadFile_PathTraversalName_IsSanitizedAndUrlUsesAttachmentId()
    {
        await using var db = CreateInMemoryDbContext();
        var (userId, _, pageId) = await SetupPageAsync(db);
        var service = new FileService(db, new MockFileStorageService());
        var bytes = "%PDF-1.7\nSafe"u8.ToArray();
        using var stream = new MemoryStream(bytes);

        var result = await service.UploadFileAsync(
            userId, pageId, stream, "../../safe.pdf", "application/pdf", stream.Length);

        Assert.Equal("safe.pdf", result.Name);
        Assert.Equal($"/api/files/{result.Id}/download", result.Url);
    }

    [Theory]
    [MemberData(nameof(ValidFileSignatures))]
    public async Task UploadFile_AllowedTypeWithValidSignature_IsAccepted(
        string fileName,
        string contentType,
        byte[] bytes)
    {
        await using var db = CreateInMemoryDbContext();
        var (userId, _, pageId) = await SetupPageAsync(db);
        var service = new FileService(db, new MockFileStorageService());
        using var stream = new MemoryStream(bytes);

        var result = await service.UploadFileAsync(
            userId, pageId, stream, fileName, contentType, stream.Length);

        Assert.Equal(fileName, result.Name);
        Assert.Equal(contentType, result.MimeType);
    }

    [Fact]
    public async Task DownloadFile_PrivatePageRejectsUnrelatedUser_ButPublicPageAllowsAnonymous()
    {
        await using var db = CreateInMemoryDbContext();
        var (ownerId, _, pageId) = await SetupPageAsync(db);
        var service = new FileService(db, new MockFileStorageService());
        var bytes = "%PDF-1.7\nAccess"u8.ToArray();
        using var stream = new MemoryStream(bytes);
        var file = await service.UploadFileAsync(
            ownerId, pageId, stream, "access.pdf", "application/pdf", stream.Length);

        await Assert.ThrowsAsync<NotionClone.Application.Common.Exceptions.ForbiddenException>(() =>
            service.DownloadFileAsync(Guid.NewGuid(), file.Id));

        var page = await db.Pages.SingleAsync(p => p.Id == pageId);
        page.IsPublic = true;
        await db.SaveChangesAsync();

        var (_, contentType, fileName) = await service.DownloadFileAsync(Guid.Empty, file.Id);
        Assert.Equal("application/pdf", contentType);
        Assert.Equal("access.pdf", fileName);
    }

    [Fact]
    public async Task UploadFile_OversizedOrMismatchedMime_IsRejected()
    {
        await using var db = CreateInMemoryDbContext();
        var (userId, _, pageId) = await SetupPageAsync(db);
        var service = new FileService(db, new MockFileStorageService());
        var bytes = "%PDF-1.7\nTest"u8.ToArray();

        using var oversized = new MemoryStream(bytes);
        await Assert.ThrowsAsync<NotionClone.Application.Common.Exceptions.ValidationException>(() =>
            service.UploadFileAsync(userId, pageId, oversized, "large.pdf", "application/pdf", 20L * 1024 * 1024 + 1));

        using var mismatched = new MemoryStream(bytes);
        await Assert.ThrowsAsync<NotionClone.Application.Common.Exceptions.ValidationException>(() =>
            service.UploadFileAsync(userId, pageId, mismatched, "fake.png", "application/pdf", mismatched.Length));

        using var invalidExtension = new MemoryStream(bytes);
        await Assert.ThrowsAsync<NotionClone.Application.Common.Exceptions.ValidationException>(() =>
            service.UploadFileAsync(userId, pageId, invalidExtension, "script.exe", "application/octet-stream", invalidExtension.Length));
    }
}
