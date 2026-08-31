import { mockSearchService } from '../mock/mockSearchService';
import type { Page } from '../types/page';
import type { SearchResult } from '../mock/mockSearchService';

export type { SearchResult };

export const searchService = {
  searchPages: (query: string, workspaceId: string, allPages: Page[]) =>
    mockSearchService.searchPages(query, workspaceId, allPages),
};
