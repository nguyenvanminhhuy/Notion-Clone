import { httpClient } from './api/httpClient';
import type { Page } from '../types/page';

export interface SearchResult {
  page: Page;
  breadcrumbs: string[];
  matchType: 'title' | 'content';
  snippet?: string;
}

interface SearchResultDto {
  page: {
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
  };
  breadcrumbs: string[];
  matchType: string;
  snippet?: string;
}

function mapPage(dto: SearchResultDto['page']): Page {
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

function buildBreadcrumbs(page: Page, allPages: Page[]): string[] {
  const breadcrumbs: string[] = [];
  let currentParentId = page.parentId;
  while (currentParentId) {
    const parent = allPages.find((p) => p.id === currentParentId);
    if (!parent) break;
    breadcrumbs.unshift(parent.title || 'Untitled');
    currentParentId = parent.parentId;
  }
  return breadcrumbs;
}

function searchLocalPages(query: string, workspaceId: string, pages: Page[]): SearchResult[] {
  const q = query.toLowerCase();
  const workspacePages = pages.filter((p) => p.workspaceId === workspaceId && !p.isArchived);
  const results: SearchResult[] = [];

  for (const page of workspacePages) {
    const titleMatch = page.title.toLowerCase().includes(q);
    const contentMatch = page.content.toLowerCase().includes(q);

    if (titleMatch || contentMatch) {
      results.push({
        page,
        breadcrumbs: buildBreadcrumbs(page, pages),
        matchType: titleMatch ? 'title' : 'content',
        snippet: contentMatch ? page.content.slice(0, 100) : undefined,
      });
    }
  }

  return results;
}

export const searchService = {
  async searchPages(query: string, workspaceId: string, allPages?: Page[]): Promise<SearchResult[]> {
    if (!query.trim() || !workspaceId) return [];

    // If local pages provided explicitly (e.g. in offline mode or unit tests), search them
    if (allPages && allPages.length > 0) {
      return searchLocalPages(query.trim(), workspaceId, allPages);
    }

    try {
      const results = await httpClient.get<SearchResultDto[]>('/api/search', {
        params: { q: query.trim(), workspaceId },
      });
      return results.map((r) => ({
        page: mapPage(r.page),
        breadcrumbs: r.breadcrumbs || [],
        matchType: (r.matchType?.toLowerCase() === 'content' ? 'content' : 'title') as 'title' | 'content',
        snippet: r.snippet,
      }));
    } catch (error) {
      if (allPages) {
        return searchLocalPages(query.trim(), workspaceId, allPages);
      }
      console.error('Failed to search pages:', error);
      return [];
    }
  },
};
