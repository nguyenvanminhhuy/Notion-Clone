import { describe, it, expect } from 'vitest';
import { searchService } from '../services/searchService';
import type { Page } from '../types/page';

describe('Search Service', () => {
  const mockPages: Page[] = [
    {
      id: 'p1',
      workspaceId: 'ws-1',
      parentId: null,
      title: 'Project Roadmap & Goals',
      content: 'Here are the key objectives and milestones for Q3.',
      icon: '🚀',
      cover: null,
      isFavorite: true,
      isArchived: false,
      isPublic: false,
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      lastOpenedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'p2',
      workspaceId: 'ws-1',
      parentId: 'p1',
      title: 'Architecture Spec',
      content: 'Detailed design notes for Next.js App Router and Zustand state management.',
      icon: '🏗️',
      cover: null,
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
      id: 'p3',
      workspaceId: 'ws-2',
      parentId: null,
      title: 'Personal Journal',
      content: 'Private workspace page content.',
      icon: '📓',
      cover: null,
      isFavorite: false,
      isArchived: false,
      isPublic: false,
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
      lastOpenedAt: '2026-01-03T00:00:00.000Z',
    },
  ];

  it('matches page by title query', async () => {
    const results = await searchService.searchPages('Roadmap', 'ws-1', mockPages);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].page.id).toBe('p1');
    expect(results[0].matchType).toBe('title');
  });

  it('matches page by content query', async () => {
    const results = await searchService.searchPages('App Router', 'ws-1', mockPages);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].page.id).toBe('p2');
    expect(results[0].matchType).toBe('content');
  });

  it('scopes search results to current workspace', async () => {
    const results = await searchService.searchPages('Journal', 'ws-1', mockPages);
    expect(results).toHaveLength(0);
  });

  it('generates correct breadcrumb path for child page', async () => {
    const results = await searchService.searchPages('Architecture', 'ws-1', mockPages);
    expect(results).toHaveLength(1);
    expect(results[0].breadcrumbs).toEqual(['Project Roadmap & Goals']);
  });
});
