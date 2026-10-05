using Microsoft.EntityFrameworkCore;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.File;
using NotionClone.Application.Interfaces;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Infrastructure.Services;

public class FileService : IFileService
{
    private const long MaxFileSizeBytes = 20 * 1024 * 1024;
    private static readonly IReadOnlyDictionary<string, string> AllowedTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".png"] = "image/png",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".webp"] = "image/webp",
            [".gif"] = "image/gif",
            [".pdf"] = "application/pdf"
        };
    private readonly NotionDbContext _dbContext;
    private readonly IFileStorageService _storageService;
    private readonly IPageAuthorizationService _authorization;

    public FileService(NotionDbContext dbContext, IFileStorageService storageService, IPageAuthorizationService? authorization = null)
    {
        _dbContext = dbContext;
        _storageService = storageService;
        _authorization = authorization ?? new PageAuthorizationService(dbContext);
    }

    public async Task<FileAttachmentDto> UploadFileAsync(
        Guid userId,
        Guid pageId,
        Stream fileStream,
        string fileName,
        string contentType,
        long sizeBytes,
        CancellationToken ct = default)
    {
        if (sizeBytes <= 0)
        {
            throw new ValidationException("Cannot upload an empty file.");
        }

        if (sizeBytes > MaxFileSizeBytes)
        {
            throw new ValidationException($"File size exceeds the maximum limit of {MaxFileSizeBytes / 1024 / 1024}MB.");
        }

        if (string.IsNullOrWhiteSpace(fileName))
        {
            throw new ValidationException("File name is required.");
        }

        var safeFileName = Path.GetFileName(fileName);
        var extension = Path.GetExtension(safeFileName).ToLowerInvariant();
        if (!AllowedTypes.TryGetValue(extension, out var expectedContentType))
            throw new ValidationException("File type is not allowed. Use PNG, JPEG, WEBP, GIF, or PDF.");
        if (!string.Equals(contentType, expectedContentType, StringComparison.OrdinalIgnoreCase))
            throw new ValidationException("File MIME type does not match its extension.");
        if (!await HasValidSignatureAsync(fileStream, expectedContentType, ct))
            throw new ValidationException("File content does not match the declared file type.");

        var page = await _dbContext.Pages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pageId, ct)
            ?? throw new NotFoundException($"Page with ID '{pageId}' was not found.");

        await _authorization.EnsurePagePermissionAsync(userId, pageId, PagePermission.Edit, ct);

        var (storageKey, _) = await _storageService.SaveFileAsync(fileStream, safeFileName, expectedContentType, ct);

        var attachment = new FileAttachment
        {
            Id = Guid.NewGuid(),
            PageId = pageId,
            Name = safeFileName,
            StorageKey = storageKey,
            Url = string.Empty,
            SizeBytes = sizeBytes,
            MimeType = expectedContentType,
            UploadedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        attachment.Url = $"/api/files/{attachment.Id}/download";

        _dbContext.FileAttachments.Add(attachment);
        await _dbContext.SaveChangesAsync(ct);

        return MapToFileAttachmentDto(attachment);
    }

    public async Task<(Stream stream, string contentType, string fileName)> DownloadFileAsync(
        Guid userId,
        Guid fileId,
        CancellationToken ct = default)
    {
        var file = await _dbContext.FileAttachments
            .Include(fa => fa.Page)
            .FirstOrDefaultAsync(fa => fa.Id == fileId, ct)
            ?? throw new NotFoundException($"File with ID '{fileId}' was not found.");

        if (!file.Page.IsPublic || file.Page.IsArchived)
        {
            await _authorization.EnsurePagePermissionAsync(userId, file.PageId, PagePermission.Read, ct);
        }

        var stream = await _storageService.GetFileAsync(file.StorageKey, ct)
            ?? throw new NotFoundException("Underlying file content not found in storage.");

        return (stream, file.MimeType, file.Name);
    }

    public async Task<FileAttachmentDto> GetFileMetadataAsync(Guid userId, Guid fileId, CancellationToken ct = default)
    {
        var file = await _dbContext.FileAttachments
            .Include(fa => fa.Page)
            .AsNoTracking()
            .FirstOrDefaultAsync(fa => fa.Id == fileId, ct)
            ?? throw new NotFoundException($"File with ID '{fileId}' was not found.");

        if (!file.Page.IsPublic || file.Page.IsArchived)
        {
            await _authorization.EnsurePagePermissionAsync(userId, file.PageId, PagePermission.Read, ct);
        }

        return MapToFileAttachmentDto(file);
    }

    public async Task<IEnumerable<FileAttachmentDto>> GetPageFilesAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var page = await _dbContext.Pages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pageId, ct)
            ?? throw new NotFoundException($"Page with ID '{pageId}' was not found.");

        await _authorization.EnsurePagePermissionAsync(userId, pageId, PagePermission.Read, ct);

        var files = await _dbContext.FileAttachments
            .AsNoTracking()
            .Where(fa => fa.PageId == pageId)
            .OrderByDescending(fa => fa.CreatedAt)
            .ToListAsync(ct);

        return files.Select(MapToFileAttachmentDto);
    }

    public async Task DeleteFileAsync(Guid userId, Guid fileId, CancellationToken ct = default)
    {
        var file = await _dbContext.FileAttachments
            .Include(fa => fa.Page)
            .FirstOrDefaultAsync(fa => fa.Id == fileId, ct)
            ?? throw new NotFoundException($"File with ID '{fileId}' was not found.");

        await _authorization.EnsurePagePermissionAsync(userId, file.PageId, PagePermission.Read, ct);
        var canManage = await _authorization.HasPagePermissionAsync(userId, file.PageId, PagePermission.ManageSharing, ct);

        if (file.UploadedById != userId && !canManage)
        {
            throw new ForbiddenException("You do not have permission to delete this file.");
        }

        await _storageService.DeleteFileAsync(file.StorageKey, ct);

        _dbContext.FileAttachments.Remove(file);
        await _dbContext.SaveChangesAsync(ct);
    }

    private async Task<WorkspaceMember> EnsureWorkspaceMemberAsync(Guid userId, Guid workspaceId, CancellationToken ct)
    {
        var member = await _dbContext.WorkspaceMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId, ct);

        if (member == null)
        {
            throw new ForbiddenException("You do not have access to this workspace.");
        }

        return member;
    }

    private static FileAttachmentDto MapToFileAttachmentDto(FileAttachment fa) =>
        new(
            fa.Id,
            fa.PageId,
            fa.Name,
            fa.Url,
            fa.SizeBytes,
            fa.MimeType,
            fa.UploadedById,
            fa.CreatedAt
        );

    private static async Task<bool> HasValidSignatureAsync(Stream stream, string contentType, CancellationToken ct)
    {
        if (!stream.CanSeek) return false;

        var originalPosition = stream.Position;
        var header = new byte[12];
        var bytesRead = await stream.ReadAsync(header.AsMemory(0, header.Length), ct);
        stream.Position = originalPosition;

        return contentType switch
        {
            "image/png" => bytesRead >= 8 && header[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
            "image/jpeg" => bytesRead >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
            "image/gif" => bytesRead >= 6 && (header[..6].SequenceEqual("GIF87a"u8.ToArray()) || header[..6].SequenceEqual("GIF89a"u8.ToArray())),
            "image/webp" => bytesRead >= 12 && header[..4].SequenceEqual("RIFF"u8.ToArray()) && header[8..12].SequenceEqual("WEBP"u8.ToArray()),
            "application/pdf" => bytesRead >= 5 && header[..5].SequenceEqual("%PDF-"u8.ToArray()),
            _ => false
        };
    }
}
