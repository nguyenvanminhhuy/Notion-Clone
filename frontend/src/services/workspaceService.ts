import { httpClient } from './api/httpClient';
import type { Workspace, WorkspaceMember, WorkspacePlan } from '../types/workspace';
import type { UserRole } from '../types/user';

interface WorkspaceDto {
  id: string;
  name: string;
  slug: string;
  iconEmoji: string | null;
  iconUrl: string | null;
  plan: string | WorkspacePlan;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceMemberDto {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  role: string | UserRole;
  joinedAt: string;
}

function mapWorkspace(dto: WorkspaceDto): Workspace {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    iconEmoji: dto.iconEmoji,
    iconUrl: dto.iconUrl,
    plan: (typeof dto.plan === 'string' ? dto.plan.toLowerCase() : 'free') as WorkspacePlan,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function mapMember(dto: WorkspaceMemberDto): WorkspaceMember {
  return {
    id: dto.id,
    workspaceId: dto.workspaceId,
    userId: dto.userId,
    userName: dto.userName,
    userEmail: dto.userEmail,
    userAvatarUrl: dto.userAvatarUrl,
    role: (typeof dto.role === 'string' ? dto.role.toLowerCase() : 'member') as UserRole,
    joinedAt: dto.joinedAt,
  };
}

export const workspaceService = {
  async getWorkspaces(): Promise<Workspace[]> {
    const list = await httpClient.get<WorkspaceDto[]>('/api/workspaces');
    return list.map(mapWorkspace);
  },

  async getWorkspace(id: string): Promise<Workspace> {
    const dto = await httpClient.get<WorkspaceDto>(`/api/workspaces/${id}`);
    return mapWorkspace(dto);
  },

  async createWorkspace(data: { name: string; iconEmoji?: string; iconUrl?: string }): Promise<Workspace> {
    const dto = await httpClient.post<WorkspaceDto>('/api/workspaces', data);
    return mapWorkspace(dto);
  },

  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace> {
    const dto = await httpClient.put<WorkspaceDto>(`/api/workspaces/${id}`, {
      name: data.name,
      iconEmoji: data.iconEmoji,
      iconUrl: data.iconUrl,
      plan: data.plan ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1) : undefined,
    });
    return mapWorkspace(dto);
  },

  async deleteWorkspace(id: string): Promise<void> {
    await httpClient.delete(`/api/workspaces/${id}`);
  },

  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const list = await httpClient.get<WorkspaceMemberDto[]>(`/api/workspaces/${workspaceId}/members`);
    return list.map(mapMember);
  },

  async inviteMember(workspaceId: string, email: string, role: UserRole): Promise<WorkspaceMember> {
    const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
    const dto = await httpClient.post<WorkspaceMemberDto>(`/api/workspaces/${workspaceId}/members`, {
      email,
      role: roleCapitalized,
    });
    return mapMember(dto);
  },

  async updateMemberRole(workspaceId: string, userId: string, role: UserRole): Promise<void> {
    const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
    await httpClient.put(`/api/workspaces/${workspaceId}/members/${userId}`, {
      role: roleCapitalized,
    });
  },

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await httpClient.delete(`/api/workspaces/${workspaceId}/members/${userId}`);
  },
};
