import { httpClient } from './api/httpClient';
import type { PageRole, PageShare, Page } from '../types/page';

interface BackendShareDto {
  id: string;
  pageId: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userAvatarUrl: string | null;
  email: string | null;
  role: string | PageRole;
  createdAt: string;
}

export interface PublicPage {
  id: string;
  title: string;
  icon: string | null;
  cover: string | null;
  content: string;
  updatedAt: string;
}

interface BackendPageDto {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  cover: string | null;
  content: string;
  isFavorite: boolean;
  isArchived: boolean;
  isPublic: boolean;
  createdById: string;
  lastEditedById: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
}

function mapShare(dto: BackendShareDto): PageShare {
  return {
    id: dto.id,
    pageId: dto.pageId,
    userId: dto.userId,
    email: dto.email || dto.userEmail,
    role: (typeof dto.role === 'string' ? dto.role.toLowerCase() : 'viewer') as PageRole,
    createdAt: dto.createdAt,
  };
}

export const shareService = {
  async getPageShares(pageId: string): Promise<PageShare[]> {
    const list = await httpClient.get<BackendShareDto[]>(`/api/pages/${pageId}/shares`);
    return list.map(mapShare);
  },

  async sharePage(pageId: string, email: string, role: PageRole = 'viewer'): Promise<PageShare> {
    const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
    const dto = await httpClient.post<BackendShareDto>(`/api/pages/${pageId}/shares`, {
      email,
      role: roleCapitalized,
    });
    return mapShare(dto);
  },

  async updateShareRole(shareId: string, role: PageRole): Promise<PageShare> {
    const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
    const dto = await httpClient.patch<BackendShareDto>(`/api/shares/${shareId}`, {
      role: roleCapitalized,
    });
    return mapShare(dto);
  },

  async removeShare(shareId: string): Promise<void> {
    await httpClient.delete(`/api/shares/${shareId}`);
  },

  async togglePublicAccess(pageId: string, isPublic: boolean): Promise<Page> {
    const response = await httpClient.post<BackendPageDto>(`/api/pages/${pageId}/public`, {
      isPublic,
    });
    return {
      ...response,
      createdBy: response.createdById,
      lastEditedBy: response.lastEditedById,
    };
  },

  async getPublicPage(pageId: string): Promise<PublicPage> {
    return httpClient.get<PublicPage>(`/api/public/pages/${pageId}`, { skipAuth: true });
  },
};
