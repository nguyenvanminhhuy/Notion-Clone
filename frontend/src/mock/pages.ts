import type { Page } from '../types/page';

export const MOCK_PAGES: Page[] = [
  // === Workspace ws-1: Personal ===
  {
    id: 'page-1',
    workspaceId: 'ws-1',
    parentId: null,
    title: 'Projects',
    icon: '📁',
    cover: null,
    content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My project notes."}]}]}',
    isFavorite: true,
    isArchived: false,
    isPublic: false,
    createdBy: 'user-1',
    lastEditedBy: 'user-1',
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-06-10T15:00:00Z',
    lastOpenedAt: '2024-06-10T15:00:00Z',
  },
  {
    id: 'page-2',
    workspaceId: 'ws-1',
    parentId: 'page-1',
    title: 'Frontend',
    icon: '🎨',
    cover: null,
    content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Frontend development notes."}]}]}',
    isFavorite: false,
    isArchived: false,
    isPublic: false,
    createdBy: 'user-1',
    lastEditedBy: 'user-1',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-06-09T12:00:00Z',
    lastOpenedAt: '2024-06-09T12:00:00Z',
  },
  {
    id: 'page-3',
    workspaceId: 'ws-1',
    parentId: 'page-2',
    title: 'React',
    icon: '⚛️',
    cover: null,
    content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"React patterns and best practices."}]}]}',
    isFavorite: false,
    isArchived: false,
    isPublic: false,
    createdBy: 'user-1',
    lastEditedBy: 'user-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-08T09:00:00Z',
    lastOpenedAt: '2024-06-08T09:00:00Z',
  },
  {
    id: 'page-4',
    workspaceId: 'ws-1',
    parentId: 'page-2',
    title: 'Next.js',
    icon: '▲',
    cover: null,
    content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Next.js App Router notes."}]}]}',
    isFavorite: false,
    isArchived: false,
    isPublic: false,
    createdBy: 'user-1',
    lastEditedBy: 'user-1',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-06-07T14:00:00Z',
    lastOpenedAt: '2024-06-07T14:00:00Z',
  },
  {
    id: 'page-5',
    workspaceId: 'ws-1',
    parentId: 'page-1',
    title: 'Backend',
    icon: '🔧',
    cover: null,
    content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Backend architecture and APIs."}]}]}',
    isFavorite: false,
    isArchived: false,
    isPublic: false,
    createdBy: 'user-1',
    lastEditedBy: 'user-1',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-06-06T10:00:00Z',
    lastOpenedAt: null,
  },
  {
    id: 'page-6',
    workspaceId: 'ws-1',
    parentId: null,
    title: 'Interview Prep',
    icon: '🎯',
    cover: null,
    content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Interview questions and answers."}]}]}',
    isFavorite: true,
    isArchived: false,
    isPublic: false,
    createdBy: 'user-1',
    lastEditedBy: 'user-1',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-06-05T11:00:00Z',
    lastOpenedAt: '2024-06-05T11:00:00Z',
  },
  {
    id: 'page-7',
    workspaceId: 'ws-1',
    parentId: null,
    title: 'Daily Notes',
    icon: '📝',
    cover: null,
    content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Daily journal and notes."}]}]}',
    isFavorite: false,
    isArchived: false,
    isPublic: false,
    createdBy: 'user-1',
    lastEditedBy: 'user-1',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-06-10T08:00:00Z',
    lastOpenedAt: '2024-06-10T08:00:00Z',
  },
  // Archived (Trash)
  {
    id: 'page-8',
    workspaceId: 'ws-1',
    parentId: null,
    title: 'Old Ideas',
    icon: '💡',
    cover: null,
    content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Old brainstorm."}]}]}',
    isFavorite: false,
    isArchived: true,
    isPublic: false,
    createdBy: 'user-1',
    lastEditedBy: 'user-1',
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
    lastOpenedAt: null,
  },
];

export function buildPageTree(pages: Page[], workspaceId: string): Page[] {
  return pages
    .filter((p) => p.workspaceId === workspaceId && !p.isArchived && p.parentId === null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getChildPages(pages: Page[], parentId: string): Page[] {
  return pages
    .filter((p) => p.parentId === parentId && !p.isArchived)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getArchivedPages(pages: Page[], workspaceId: string): Page[] {
  return pages.filter((p) => p.workspaceId === workspaceId && p.isArchived);
}

export function getFavoritePages(pages: Page[], workspaceId: string): Page[] {
  return pages.filter((p) => p.workspaceId === workspaceId && p.isFavorite && !p.isArchived);
}

export function getRecentPages(pages: Page[], workspaceId: string): Page[] {
  return pages
    .filter((p) => p.workspaceId === workspaceId && !p.isArchived && p.lastOpenedAt !== null)
    .sort((a, b) => {
      const dateA = a.lastOpenedAt ?? '';
      const dateB = b.lastOpenedAt ?? '';
      return dateB.localeCompare(dateA);
    })
    .slice(0, 10);
}
