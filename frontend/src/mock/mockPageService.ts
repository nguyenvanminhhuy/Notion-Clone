import type { Page } from '../types/page';
import { MOCK_PAGES } from './pages';

// In-memory store — seeded from static mock data
// In production this entire file gets replaced by real API calls
let store: Page[] = structuredClone(MOCK_PAGES);

function delay(ms = 120): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const mockPageService = {
  async getPages(workspaceId: string): Promise<Page[]> {
    await delay();
    return store.filter((p) => p.workspaceId === workspaceId);
  },

  async getPage(id: string): Promise<Page | null> {
    await delay(80);
    return store.find((p) => p.id === id) ?? null;
  },

  async createPage(data: {
    workspaceId: string;
    parentId?: string | null;
    title?: string;
    icon?: string | null;
  }): Promise<Page> {
    await delay(100);
    const now = new Date().toISOString();
    const newPage: Page = {
      id: generateId(),
      workspaceId: data.workspaceId,
      parentId: data.parentId ?? null,
      title: data.title ?? 'Untitled',
      icon: data.icon ?? null,
      cover: null,
      content: '{"type":"doc","content":[{"type":"paragraph"}]}',
      isFavorite: false,
      isArchived: false,
      isPublic: false,
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    };
    store = [...store, newPage];
    return newPage;
  },

  async updatePage(id: string, data: Partial<Page>): Promise<Page> {
    await delay(80);
    const index = store.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Page ${id} not found`);
    const updated: Page = {
      ...store[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    store = store.map((p) => (p.id === id ? updated : p));
    return updated;
  },

  async deletePage(id: string): Promise<void> {
    // Soft delete: mark as archived (also archives all children)
    await delay(80);
    const idsToArchive = collectDescendantIds(id, store);
    idsToArchive.push(id);
    const now = new Date().toISOString();
    store = store.map((p) =>
      idsToArchive.includes(p.id)
        ? { ...p, isArchived: true, updatedAt: now }
        : p
    );
  },

  async restorePage(id: string): Promise<void> {
    await delay(80);
    const now = new Date().toISOString();
    store = store.map((p) =>
      p.id === id ? { ...p, isArchived: false, updatedAt: now } : p
    );
  },

  async permanentDeletePage(id: string): Promise<void> {
    await delay(80);
    const idsToDelete = collectDescendantIds(id, store);
    idsToDelete.push(id);
    store = store.filter((p) => !idsToDelete.includes(p.id));
  },

  async duplicatePage(id: string): Promise<Page> {
    await delay(150);
    const original = store.find((p) => p.id === id);
    if (!original) throw new Error(`Page ${id} not found`);
    const now = new Date().toISOString();
    const duplicate: Page = {
      ...original,
      id: generateId(),
      title: `${original.title} (Copy)`,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: null,
    };
    store = [...store, duplicate];
    return duplicate;
  },

  async toggleFavorite(id: string): Promise<Page> {
    await delay(80);
    const page = store.find((p) => p.id === id);
    if (!page) throw new Error(`Page ${id} not found`);
    return mockPageService.updatePage(id, { isFavorite: !page.isFavorite });
  },

  async recordPageOpen(id: string): Promise<void> {
    await delay(50);
    const now = new Date().toISOString();
    store = store.map((p) =>
      p.id === id ? { ...p, lastOpenedAt: now } : p
    );
  },
};

function collectDescendantIds(parentId: string, pages: Page[]): string[] {
  const children = pages.filter((p) => p.parentId === parentId);
  return children.flatMap((c) => [c.id, ...collectDescendantIds(c.id, pages)]);
}
