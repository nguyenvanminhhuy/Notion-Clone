import { httpClient } from './api/httpClient';
import type { User, UserRole } from '../types/user';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

function mapUserDtoToUser(dto: AuthResponse['user']): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    avatarUrl: dto.avatarUrl,
    role: (dto.role?.toLowerCase() || 'member') as UserRole,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export const authService = {
  async register(data: RegisterRequest): Promise<{ user: User; accessToken: string; refreshToken: string; expiresAt: string }> {
    const response = await httpClient.post<AuthResponse>('/api/auth/register', data, { skipAuth: true });
    return {
      user: mapUserDtoToUser(response.user),
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: response.expiresAt,
    };
  },

  async login(data: LoginRequest): Promise<{ user: User; accessToken: string; refreshToken: string; expiresAt: string }> {
    const response = await httpClient.post<AuthResponse>('/api/auth/login', data, { skipAuth: true });
    return {
      user: mapUserDtoToUser(response.user),
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: response.expiresAt,
    };
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await httpClient.post<{ accessToken: string; refreshToken: string }>(
      '/api/auth/refresh-token',
      { refreshToken },
      { skipAuth: true }
    );
    return response;
  },

  async revokeToken(refreshToken?: string): Promise<void> {
    await httpClient.post('/api/auth/revoke-token', { refreshToken });
  },

  async getMe(): Promise<User> {
    const dto = await httpClient.get<AuthResponse['user']>('/api/auth/me');
    return mapUserDtoToUser(dto);
  },
};
