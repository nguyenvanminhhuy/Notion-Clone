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
    private const long MaxFileSizeBytes = 50 * 1024 * 1024; // 50MB
    private readonly NotionDbContext _dbContext;
    private readonly IFileStorageService _storageService;

    public FileService(NotionDbContext dbContext, IFileStorageService storageService)
    {
        _dbContext = dbContext;
        _storageService = storageService;
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

        var page = await _dbContext.Pages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pageId, ct)
            ?? throw new NotFoundException($"Page with ID '{pageId}' was not found.");

        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

        var (storageKey, url) = await _storageService.SaveFileAsync(fileStream, fileName, contentType, ct);

        var attachment = new FileAttachment
        {
            Id = Guid.NewGuid(),
            PageId = pageId,
            Name = Path.GetFileName(fileName),
            StorageKey = storageKey,
            Url = url,
            SizeBytes = sizeBytes,
            MimeType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType,
            UploadedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

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

        if (!file.Page.IsPublic)
        {
            await EnsureWorkspaceMemberAsync(userId, file.Page.WorkspaceId, ct);
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

        if (!file.Page.IsPublic)
        {
            await EnsureWorkspaceMemberAsync(userId, file.Page.WorkspaceId, ct);
        }

        return MapToFileAttachmentDto(file);
    }

    public async Task<IEnumerable<FileAttachmentDto>> GetPageFilesAsync(Guid userId, Guid pageId, CancellationToken ct = default)
    {
        var page = await _dbContext.Pages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pageId, ct)
            ?? throw new NotFoundException($"Page with ID '{pageId}' was not found.");

        await EnsureWorkspaceMemberAsync(userId, page.WorkspaceId, ct);

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

        var member = await EnsureWorkspaceMemberAsync(userId, file.Page.WorkspaceId, ct);

        if (file.UploadedById != userId && member.Role != UserRole.Owner && member.Role != UserRole.Admin)
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
}
