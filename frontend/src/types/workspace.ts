import type { UserRole } from './user';

export type WorkspacePlan = 'free' | 'pro' | 'business' | 'enterprise';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  iconEmoji: string | null;
  iconUrl: string | null;
  plan: WorkspacePlan;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string | null;
  role: UserRole;
  joinedAt: string;
}
