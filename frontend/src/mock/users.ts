import type { User, UserSettings } from '../types/user';

export const MOCK_CURRENT_USER: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  avatarUrl: null,
  role: 'owner',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

export const MOCK_USERS: User[] = [
  MOCK_CURRENT_USER,
  {
    id: 'user-2',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    avatarUrl: null,
    role: 'member',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'user-3',
    name: 'Sam Chen',
    email: 'sam@example.com',
    avatarUrl: null,
    role: 'member',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
];

export const MOCK_USER_SETTINGS: UserSettings = {
  userId: 'user-1',
  theme: 'system',
  fontSize: 'md',
  lineHeight: 'normal',
  fullWidth: false,
  aiEnabled: true,
  aiModel: 'gpt-4o',
  aiResponseStyle: 'balanced',
};
