import { describe, it, expect } from 'vitest';
import type { Page } from '../types/page';

// Helper function to build page tree structure
export function buildPageTree(pages: Page[], parentId: string | null = null): Page[] {
  return pages
    .filter((p) => p.parentId === parentId && !p.isArchived)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Helper function to find all descendant IDs
export function getDescendantIds(parentId: string, allPages: Page[]): string[] {
  const children = allPages.filter((p) => p.parentId === parentId);
  return children.flatMap((c) => [c.id, ...getDescendantIds(c.id, allPages)]);
}

describe('Page Tree Utility Functions', () => {
  const mockPages: Page[] = [
    {
      id: 'page-1',
      workspaceId: 'ws-1',
      parentId: null,
      title: 'Root Page 1',
      icon: '📄',
      cover: null,
      content: '',
      isFavorite: false,
      isArchived: false,
      isPublic: false,
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      lastOpenedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'page-2',
      workspaceId: 'ws-1',
      parentId: 'page-1',
      title: 'Child Page 1.1',
      icon: null,
      cover: null,
      content: '',
      isFavorite: false,
      isArchived: false,
      isPublic: false,
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      lastOpenedAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'page-3',
      workspaceId: 'ws-1',
      parentId: 'page-2',
      title: 'Grandchild Page 1.1.1',
      icon: null,
      cover: null,
      content: '',
      isFavorite: false,
      isArchived: false,
      isPublic: false,
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
      lastOpenedAt: '2026-01-03T00:00:00.000Z',
    },
    {
      id: 'page-4',
      workspaceId: 'ws-1',
      parentId: null,
      title: 'Archived Root',
      icon: null,
      cover: null,
      content: '',
      isFavorite: false,
      isArchived: true,
      isPublic: false,
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
      createdAt: '2026-01-04T00:00:00.000Z',
      updatedAt: '2026-01-04T00:00:00.000Z',
      lastOpenedAt: '2026-01-04T00:00:00.000Z',
    },
  ];

  it('filters root level unarchived pages correctly', () => {
    const rootPages = buildPageTree(mockPages, null);
    expect(rootPages).toHaveLength(1);
    expect(rootPages[0].id).toBe('page-1');
  });

  it('filters child pages for a parent ID', () => {
    const children = buildPageTree(mockPages, 'page-1');
    expect(children).toHaveLength(1);
    expect(children[0].id).toBe('page-2');
  });

  it('calculates all descendant IDs recursively', () => {
    const descendants = getDescendantIds('page-1', mockPages);
    expect(descendants).toEqual(['page-2', 'page-3']);
  });

  it('returns empty array when parent has no children', () => {
    const descendants = getDescendantIds('page-3', mockPages);
    expect(descendants).toEqual([]);
  });
});
