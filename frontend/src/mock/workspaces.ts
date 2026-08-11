import type { Workspace, WorkspaceMember } from '../types/workspace';

export const MOCK_WORKSPACES: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Personal',
    slug: 'personal',
    iconEmoji: '🏠',
    iconUrl: null,
    plan: 'free',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'ws-2',
    name: 'Development',
    slug: 'development',
    iconEmoji: '⚡',
    iconUrl: null,
    plan: 'pro',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'ws-3',
    name: 'My Projects',
    slug: 'my-projects',
    iconEmoji: '🚀',
    iconUrl: null,
    plan: 'free',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
];

export const MOCK_WORKSPACE_MEMBERS: WorkspaceMember[] = [
  {
    id: 'member-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    role: 'owner',
    joinedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'member-2',
    workspaceId: 'ws-2',
    userId: 'user-1',
    role: 'owner',
    joinedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'member-3',
    workspaceId: 'ws-2',
    userId: 'user-2',
    role: 'member',
    joinedAt: '2024-02-15T00:00:00Z',
  },
  {
    id: 'member-4',
    workspaceId: 'ws-3',
    userId: 'user-1',
    role: 'owner',
    joinedAt: '2024-03-01T00:00:00Z',
  },
];

export const DEFAULT_WORKSPACE_ID = 'ws-1';
