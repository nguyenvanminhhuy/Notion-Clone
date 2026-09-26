using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClone.Application.DTOs.Workspace;
using NotionClone.Application.Interfaces;

namespace NotionClone.Api.Controllers;

[Authorize]
[Route("api/workspaces")]
public class WorkspacesController : ApiControllerBase
{
    private readonly IWorkspaceService _workspaceService;

    public WorkspacesController(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    /// <summary>Get all workspaces for the authenticated user.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<WorkspaceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserWorkspaces(CancellationToken ct)
    {
        var workspaces = await _workspaceService.GetUserWorkspacesAsync(CurrentUserId, ct);
        return Ok(workspaces);
    }

    /// <summary>Create a new workspace.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(WorkspaceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateWorkspace([FromBody] CreateWorkspaceRequest request, CancellationToken ct)
    {
        var workspace = await _workspaceService.CreateWorkspaceAsync(CurrentUserId, request, ct);
        return CreatedAtAction(nameof(GetWorkspace), new { id = workspace.Id }, workspace);
    }

    /// <summary>Get workspace details by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(WorkspaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWorkspace(Guid id, CancellationToken ct)
    {
        var workspace = await _workspaceService.GetWorkspaceByIdAsync(CurrentUserId, id, ct);
        return Ok(workspace);
    }

    /// <summary>Update workspace settings.</summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(WorkspaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateWorkspace(Guid id, [FromBody] UpdateWorkspaceRequest request, CancellationToken ct)
    {
        var workspace = await _workspaceService.UpdateWorkspaceAsync(CurrentUserId, id, request, ct);
        return Ok(workspace);
    }

    /// <summary>Delete a workspace.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteWorkspace(Guid id, CancellationToken ct)
    {
        await _workspaceService.DeleteWorkspaceAsync(CurrentUserId, id, ct);
        return NoContent();
    }

    /// <summary>Get members of a workspace.</summary>
    [HttpGet("{id:guid}/members")]
    [ProducesResponseType(typeof(IEnumerable<WorkspaceMemberDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMembers(Guid id, CancellationToken ct)
    {
        var members = await _workspaceService.GetMembersAsync(CurrentUserId, id, ct);
        return Ok(members);
    }

    /// <summary>Invite/add a member to a workspace.</summary>
    [HttpPost("{id:guid}/members")]
    [ProducesResponseType(typeof(WorkspaceMemberDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] InviteMemberRequest request, CancellationToken ct)
    {
        var member = await _workspaceService.AddMemberAsync(CurrentUserId, id, request, ct);
        return CreatedAtAction(nameof(GetMembers), new { id }, member);
    }

    /// <summary>Update a workspace member's role.</summary>
    [HttpPatch("{id:guid}/members/{memberId:guid}")]
    [ProducesResponseType(typeof(WorkspaceMemberDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> UpdateMemberRole(Guid id, Guid memberId, [FromBody] UpdateMemberRoleRequest request, CancellationToken ct)
    {
        var member = await _workspaceService.UpdateMemberRoleAsync(CurrentUserId, id, memberId, request, ct);
        return Ok(member);
    }

    /// <summary>Remove a member from a workspace (or leave workspace).</summary>
    [HttpDelete("{id:guid}/members/{memberId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> RemoveMember(Guid id, Guid memberId, CancellationToken ct)
    {
        await _workspaceService.RemoveMemberAsync(CurrentUserId, id, memberId, ct);
        return NoContent();
    }
}
