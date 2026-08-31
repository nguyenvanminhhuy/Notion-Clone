import type { Page } from '../types/page';

export interface SearchResult {
  page: Page;
  breadcrumbs: string[];
  matchType: 'title' | 'content';
  snippet?: string;
}

function delay(ms = 100): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function extractText(jsonStr: string): string {
  if (!jsonStr) return '';
  try {
    const recurse = (n: { text?: string; content?: unknown[] }): string => {
      if (n.text) return n.text;
      if (n.content && Array.isArray(n.content)) return n.content.map(recurse).join(' ');
      return '';
    };
    return recurse(JSON.parse(jsonStr));
  } catch {
    return jsonStr;
  }
}

export const mockSearchService = {
  async searchPages(query: string, workspaceId: string, allPages: Page[]): Promise<SearchResult[]> {
    await delay();
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const active = allPages.filter((p) => p.workspaceId === workspaceId && !p.isArchived);

    const getBreadcrumbs = (page: Page): string[] => {
      const list: string[] = [];
      let cur: Page | undefined = page;
      while (cur?.parentId) {
        const parent = active.find((p) => p.id === cur!.parentId);
        if (!parent) break;
        list.unshift(parent.title || 'Untitled');
        cur = parent;
      }
      return list;
    };

    const results: SearchResult[] = [];
    for (const page of active) {
      const titleMatch = (page.title || '').toLowerCase().includes(q);
      const text = extractText(page.content);
      const ci = text.toLowerCase().indexOf(q);

      if (titleMatch) {
        results.push({ page, breadcrumbs: getBreadcrumbs(page), matchType: 'title' });
      } else if (ci !== -1) {
        const s = Math.max(0, ci - 30);
        const e = Math.min(text.length, ci + q.length + 40);
        let snippet = text.slice(s, e);
        if (s > 0) snippet = '…' + snippet;
        if (e < text.length) snippet += '…';
        results.push({ page, breadcrumbs: getBreadcrumbs(page), matchType: 'content', snippet });
      }
    }
    return results;
  },
};
