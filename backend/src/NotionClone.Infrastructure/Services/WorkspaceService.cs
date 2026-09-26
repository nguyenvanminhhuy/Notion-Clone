using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.Workspace;
using NotionClone.Application.Interfaces;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Infrastructure.Services;

public class WorkspaceService : IWorkspaceService
{
    private readonly NotionDbContext _dbContext;

    public WorkspaceService(NotionDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<WorkspaceDto>> GetUserWorkspacesAsync(Guid userId, CancellationToken ct = default)
    {
        var workspaces = await _dbContext.WorkspaceMembers
            .AsNoTracking()
            .Where(wm => wm.UserId == userId)
            .Select(wm => wm.Workspace)
            .Select(w => MapToWorkspaceDto(w))
            .ToListAsync(ct);

        return workspaces;
    }

    public async Task<WorkspaceDto> CreateWorkspaceAsync(Guid userId, CreateWorkspaceRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ValidationException("Workspace name is required.");
        }

        var slug = await GenerateUniqueSlugAsync(request.Name, ct);

        var workspace = new Workspace
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Slug = slug,
            IconEmoji = request.IconEmoji,
            IconUrl = request.IconUrl,
            Plan = WorkspacePlan.Free,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member = new WorkspaceMember
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspace.Id,
            UserId = userId,
            Role = UserRole.Owner,
            JoinedAt = DateTime.UtcNow
        };

        _dbContext.Workspaces.Add(workspace);
        _dbContext.WorkspaceMembers.Add(member);
        await _dbContext.SaveChangesAsync(ct);

        return MapToWorkspaceDto(workspace);
    }

    public async Task<WorkspaceDto> GetWorkspaceByIdAsync(Guid userId, Guid workspaceId, CancellationToken ct = default)
    {
        await EnsureMembershipAsync(userId, workspaceId, ct);

        var workspace = await _dbContext.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == workspaceId, ct)
            ?? throw new NotFoundException($"Workspace with ID '{workspaceId}' was not found.");

        return MapToWorkspaceDto(workspace);
    }

    public async Task<WorkspaceDto> UpdateWorkspaceAsync(Guid userId, Guid workspaceId, UpdateWorkspaceRequest request, CancellationToken ct = default)
    {
        var member = await EnsureMembershipAsync(userId, workspaceId, ct);
        EnsureOwnerOrAdmin(member.Role, "update workspace settings");

        var workspace = await _dbContext.Workspaces
            .FirstOrDefaultAsync(w => w.Id == workspaceId, ct)
            ?? throw new NotFoundException($"Workspace with ID '{workspaceId}' was not found.");

        if (!string.IsNullOrWhiteSpace(request.Name) && request.Name != workspace.Name)
        {
            workspace.Name = request.Name.Trim();
            workspace.Slug = await GenerateUniqueSlugAsync(workspace.Name, ct);
        }

        if (request.IconEmoji != null) workspace.IconEmoji = request.IconEmoji;
        if (request.IconUrl != null) workspace.IconUrl = request.IconUrl;
        if (request.Plan.HasValue) workspace.Plan = request.Plan.Value;

        workspace.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        return MapToWorkspaceDto(workspace);
    }

    public async Task DeleteWorkspaceAsync(Guid userId, Guid workspaceId, CancellationToken ct = default)
    {
        var member = await EnsureMembershipAsync(userId, workspaceId, ct);
        if (member.Role != UserRole.Owner)
        {
            throw new ForbiddenException("Only the workspace Owner can delete the workspace.");
        }

        var workspace = await _dbContext.Workspaces
            .FirstOrDefaultAsync(w => w.Id == workspaceId, ct)
            ?? throw new NotFoundException($"Workspace with ID '{workspaceId}' was not found.");

        _dbContext.Workspaces.Remove(workspace);
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<WorkspaceMemberDto>> GetMembersAsync(Guid userId, Guid workspaceId, CancellationToken ct = default)
    {
        await EnsureMembershipAsync(userId, workspaceId, ct);

        var members = await _dbContext.WorkspaceMembers
            .AsNoTracking()
            .Include(wm => wm.User)
            .Where(wm => wm.WorkspaceId == workspaceId)
            .Select(wm => MapToWorkspaceMemberDto(wm))
            .ToListAsync(ct);

        return members;
    }

    public async Task<WorkspaceMemberDto> AddMemberAsync(Guid userId, Guid workspaceId, InviteMemberRequest request, CancellationToken ct = default)
    {
        var callerMember = await EnsureMembershipAsync(userId, workspaceId, ct);
        EnsureOwnerOrAdmin(callerMember.Role, "invite members");

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ValidationException("Email is required to invite a member.");
        }

        var targetEmail = request.Email.ToLowerInvariant().Trim();
        var targetUser = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == targetEmail, ct)
            ?? throw new NotFoundException($"User with email '{request.Email}' was not found.");

        var existingMember = await _dbContext.WorkspaceMembers
            .AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == targetUser.Id, ct);

        if (existingMember)
        {
            throw new ConflictException($"User with email '{request.Email}' is already a member of this workspace.");
        }

        var newMember = new WorkspaceMember
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            UserId = targetUser.Id,
            Role = request.Role,
            JoinedAt = DateTime.UtcNow
        };

        _dbContext.WorkspaceMembers.Add(newMember);
        await _dbContext.SaveChangesAsync(ct);

        return new WorkspaceMemberDto(
            newMember.Id,
            newMember.WorkspaceId,
            newMember.UserId,
            targetUser.Name,
            targetUser.Email,
            targetUser.AvatarUrl,
            newMember.Role,
            newMember.JoinedAt
        );
    }

    public async Task<WorkspaceMemberDto> UpdateMemberRoleAsync(Guid userId, Guid workspaceId, Guid memberId, UpdateMemberRoleRequest request, CancellationToken ct = default)
    {
        var callerMember = await EnsureMembershipAsync(userId, workspaceId, ct);
        EnsureOwnerOrAdmin(callerMember.Role, "change member roles");

        var targetMember = await _dbContext.WorkspaceMembers
            .Include(wm => wm.User)
            .FirstOrDefaultAsync(wm => wm.Id == memberId && wm.WorkspaceId == workspaceId, ct)
            ?? throw new NotFoundException($"Member with ID '{memberId}' was not found in this workspace.");

        if (targetMember.Role == UserRole.Owner && request.Role != UserRole.Owner)
        {
            var ownerCount = await _dbContext.WorkspaceMembers
                .CountAsync(wm => wm.WorkspaceId == workspaceId && wm.Role == UserRole.Owner, ct);

            if (ownerCount <= 1)
            {
                throw new ValidationException("Cannot change role of the only owner of the workspace.");
            }
        }

        targetMember.Role = request.Role;
        await _dbContext.SaveChangesAsync(ct);

        return MapToWorkspaceMemberDto(targetMember);
    }

    public async Task RemoveMemberAsync(Guid userId, Guid workspaceId, Guid memberId, CancellationToken ct = default)
    {
        var callerMember = await EnsureMembershipAsync(userId, workspaceId, ct);

        var targetMember = await _dbContext.WorkspaceMembers
            .FirstOrDefaultAsync(wm => wm.Id == memberId && wm.WorkspaceId == workspaceId, ct)
            ?? throw new NotFoundException($"Member with ID '{memberId}' was not found in this workspace.");

        var isSelfRemoval = targetMember.UserId == userId;

        if (!isSelfRemoval)
        {
            EnsureOwnerOrAdmin(callerMember.Role, "remove members");
        }

        if (targetMember.Role == UserRole.Owner)
        {
            var ownerCount = await _dbContext.WorkspaceMembers
                .CountAsync(wm => wm.WorkspaceId == workspaceId && wm.Role == UserRole.Owner, ct);

            if (ownerCount <= 1)
            {
                throw new ValidationException("Cannot remove the only owner of the workspace.");
            }
        }

        _dbContext.WorkspaceMembers.Remove(targetMember);
        await _dbContext.SaveChangesAsync(ct);
    }

    private async Task<WorkspaceMember> EnsureMembershipAsync(Guid userId, Guid workspaceId, CancellationToken ct)
    {
        var member = await _dbContext.WorkspaceMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId, ct);

        if (member == null)
        {
            throw new ForbiddenException("You are not a member of this workspace.");
        }

        return member;
    }

    private static void EnsureOwnerOrAdmin(UserRole role, string actionDescription)
    {
        if (role != UserRole.Owner && role != UserRole.Admin)
        {
            throw new ForbiddenException($"Only Owners and Admins can {actionDescription}.");
        }
    }

    private async Task<string> GenerateUniqueSlugAsync(string name, CancellationToken ct)
    {
        var baseSlug = Regex.Replace(name.ToLowerInvariant(), @"[^a-z0-9\s-]", "");
        baseSlug = Regex.Replace(baseSlug, @"\s+", "-").Trim('-');
        if (string.IsNullOrEmpty(baseSlug)) baseSlug = "workspace";

        var slug = baseSlug;
        var count = 1;
        while (await _dbContext.Workspaces.AnyAsync(w => w.Slug == slug, ct))
        {
            slug = $"{baseSlug}-{count++}";
        }
        return slug;
    }

    private static WorkspaceDto MapToWorkspaceDto(Workspace w) =>
        new(w.Id, w.Name, w.Slug, w.IconEmoji, w.IconUrl, w.Plan, w.CreatedAt, w.UpdatedAt);

    private static WorkspaceMemberDto MapToWorkspaceMemberDto(WorkspaceMember wm) =>
        new(wm.Id, wm.WorkspaceId, wm.UserId, wm.User?.Name ?? string.Empty, wm.User?.Email ?? string.Empty, wm.User?.AvatarUrl, wm.Role, wm.JoinedAt);
}
