import { httpClient } from './api/httpClient';
import type { Page, PageNode, PageVersion } from '../types/page';

interface PageDto {
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
  createdById?: string;
  lastEditedById?: string;
  createdBy?: string;
  lastEditedBy?: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
}

export interface PageTreeItemDto {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  updatedAt: string;
  children: PageTreeItemDto[];
}

function mapPage(dto: PageDto): Page {
  return {
    id: dto.id,
    workspaceId: dto.workspaceId,
    parentId: dto.parentId ?? null,
    title: dto.title ?? 'Untitled',
    icon: dto.icon ?? null,
    cover: dto.cover ?? null,
    content: dto.content ?? '{"type":"doc","content":[{"type":"paragraph"}]}',
    isFavorite: Boolean(dto.isFavorite),
    isArchived: Boolean(dto.isArchived),
    isPublic: Boolean(dto.isPublic),
    createdBy: dto.createdById ?? dto.createdBy ?? '',
    lastEditedBy: dto.lastEditedById ?? dto.lastEditedBy ?? '',
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    lastOpenedAt: dto.lastOpenedAt ?? null,
  };
}

export const pageService = {
  async getPages(workspaceId: string): Promise<Page[]> {
    const list = await httpClient.get<PageDto[]>(`/api/workspaces/${workspaceId}/pages`);
    return list.map(mapPage);
  },

  async getPageTree(workspaceId: string): Promise<PageTreeItemDto[]> {
    return httpClient.get<PageTreeItemDto[]>(`/api/workspaces/${workspaceId}/pages/tree`);
  },

  async getPage(id: string): Promise<Page | null> {
    try {
      const dto = await httpClient.get<PageDto>(`/api/pages/${id}`);
      return mapPage(dto);
    } catch {
      return null;
    }
  },

  async createPage(data: {
    workspaceId: string;
    parentId?: string | null;
    title?: string;
    icon?: string | null;
    cover?: string | null;
    content?: string;
  }): Promise<Page> {
    const dto = await httpClient.post<PageDto>(`/api/workspaces/${data.workspaceId}/pages`, {
      parentId: data.parentId ?? null,
      title: data.title ?? 'Untitled',
      icon: data.icon ?? null,
      cover: data.cover ?? null,
      content: data.content ?? '{"type":"doc","content":[{"type":"paragraph"}]}',
    });
    return mapPage(dto);
  },

  async updatePage(id: string, data: Partial<Page>): Promise<Page> {
    const dto = await httpClient.patch<PageDto>(`/api/pages/${id}`, {
      title: data.title,
      icon: data.icon,
      cover: data.cover,
      content: data.content,
      isFavorite: data.isFavorite,
      isArchived: data.isArchived,
      isPublic: data.isPublic,
    });
    return mapPage(dto);
  },

  async movePage(id: string, targetParentId: string | null): Promise<Page> {
    const dto = await httpClient.patch<PageDto>(`/api/pages/${id}/move`, {
      targetParentId: targetParentId ?? null,
    });
    return mapPage(dto);
  },

  async deletePage(id: string): Promise<void> {
    await httpClient.delete(`/api/pages/${id}`);
  },

  async restorePage(id: string): Promise<Page> {
    const dto = await httpClient.post<PageDto>(`/api/pages/${id}/restore`);
    return mapPage(dto);
  },

  async permanentDeletePage(id: string): Promise<void> {
    await httpClient.delete(`/api/pages/${id}/permanent`);
  },

  async duplicatePage(id: string): Promise<Page> {
    const dto = await httpClient.post<PageDto>(`/api/pages/${id}/duplicate`);
    return mapPage(dto);
  },

  async toggleFavorite(id: string): Promise<Page> {
    const dto = await httpClient.post<PageDto>(`/api/pages/${id}/favorite`);
    return mapPage(dto);
  },

  async recordPageOpen(id: string): Promise<void> {
    try {
      await httpClient.post(`/api/pages/${id}/record-open`);
    } catch {
      // Non-critical background telemetry
    }
  },

  async getPageContent(id: string): Promise<string> {
    return httpClient.get<string>(`/api/pages/${id}/content`);
  },

  async updatePageContent(id: string, content: string): Promise<Page> {
    const dto = await httpClient.put<PageDto>(`/api/pages/${id}/content`, { content });
    return mapPage(dto);
  },

  async getPageVersions(id: string): Promise<PageVersion[]> {
    interface BackendVersionDto {
      id: string;
      pageId: string;
      editedById: string;
      editedByName: string;
      createdAt: string;
    }
    const list = await httpClient.get<BackendVersionDto[]>(`/api/pages/${id}/versions`);
    return list.map((v) => ({
      id: v.id,
      pageId: v.pageId,
      content: '',
      editedBy: v.editedByName || v.editedById,
      createdAt: v.createdAt,
    }));
  },

  async getPageVersionDetail(id: string, versionId: string): Promise<PageVersion> {
    interface BackendVersionDetailDto {
      id: string;
      pageId: string;
      content: string;
      editedById: string;
      editedByName: string;
      createdAt: string;
    }
    const dto = await httpClient.get<BackendVersionDetailDto>(`/api/pages/${id}/versions/${versionId}`);
    return {
      id: dto.id,
      pageId: dto.pageId,
      content: dto.content,
      editedBy: dto.editedByName || dto.editedById,
      createdAt: dto.createdAt,
    };
  },

  async restorePageVersion(id: string, versionId: string): Promise<Page> {
    const dto = await httpClient.post<PageDto>(`/api/pages/${id}/versions/${versionId}/restore`);
    return mapPage(dto);
  },
};
