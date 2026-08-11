import type { UserRole } from './user';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  iconEmoji: string | null;
  iconUrl: string | null;
  plan: 'free' | 'pro' | 'business' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
}
