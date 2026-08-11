export type UserRole = 'owner' | 'admin' | 'member' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'sm' | 'md' | 'lg';
  lineHeight: 'compact' | 'normal' | 'relaxed';
  fullWidth: boolean;
  aiEnabled: boolean;
  aiModel: string;
  aiResponseStyle: 'concise' | 'balanced' | 'detailed';
}
