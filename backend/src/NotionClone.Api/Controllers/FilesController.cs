using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClone.Application.DTOs.File;
using NotionClone.Application.Interfaces;

namespace NotionClone.Api.Controllers;

[Authorize]
[ApiController]
public class FilesController : ApiControllerBase
{
    private readonly IFileService _fileService;

    public FilesController(IFileService fileService)
    {
        _fileService = fileService;
    }

    /// <summary>Upload a file attachment for a page.</summary>
    [HttpPost("api/files")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(FileAttachmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadFile(
        [FromForm] IFormFile file,
        [FromForm] Guid pageId,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file was uploaded." });
        }

        using var stream = file.OpenReadStream();
        var result = await _fileService.UploadFileAsync(
            CurrentUserId,
            pageId,
            stream,
            file.FileName,
            file.ContentType,
            file.Length,
            ct);

        return CreatedAtAction(nameof(GetFileMetadata), new { id = result.Id }, result);
    }

    /// <summary>Get metadata for an uploaded file.</summary>
    [HttpGet("api/files/{id:guid}")]
    [ProducesResponseType(typeof(FileAttachmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFileMetadata(Guid id, CancellationToken ct)
    {
        var file = await _fileService.GetFileMetadataAsync(CurrentUserId, id, ct);
        return Ok(file);
    }

    /// <summary>Download/stream a file binary.</summary>
    [AllowAnonymous]
    [HttpGet("api/files/{id:guid}/download")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadFile(Guid id, CancellationToken ct)
    {
        // For anonymous access, DownloadFileAsync checks if the parent page is public
        var (stream, contentType, fileName) = await _fileService.DownloadFileAsync(CurrentUserIdSafe, id, ct);
        return File(stream, contentType, fileName);
    }

    /// <summary>Get all files attached to a page.</summary>
    [HttpGet("api/pages/{pageId:guid}/files")]
    [ProducesResponseType(typeof(IEnumerable<FileAttachmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPageFiles(Guid pageId, CancellationToken ct)
    {
        var files = await _fileService.GetPageFilesAsync(CurrentUserId, pageId, ct);
        return Ok(files);
    }

    /// <summary>Delete an uploaded file.</summary>
    [HttpDelete("api/files/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteFile(Guid id, CancellationToken ct)
    {
        await _fileService.DeleteFileAsync(CurrentUserId, id, ct);
        return NoContent();
    }

    private Guid CurrentUserIdSafe
    {
        get
        {
            try
            {
                return CurrentUserId;
            }
            catch
            {
                return Guid.Empty;
            }
        }
    }
}
