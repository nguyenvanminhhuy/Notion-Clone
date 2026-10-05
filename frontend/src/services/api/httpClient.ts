import { ApiError } from './apiError';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  skipAuth?: boolean;
}

export type TokenProvider = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
  onUnauthorized?: () => void;
};

export class HttpClient {
  private baseUrl: string;
  private tokenProvider: TokenProvider | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl?: string) {
    const rawUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
    if (!rawUrl) throw new Error('NEXT_PUBLIC_API_URL is required for production builds.');
    // Remove trailing slash if present
    this.baseUrl = rawUrl.replace(/\/+$/, '');
  }

  public setTokenProvider(provider: TokenProvider): void {
    this.tokenProvider = provider;
  }

  public getTokenProvider(): TokenProvider | null {
    return this.tokenProvider;
  }

  public buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // If baseUrl already ends with /api and cleanPath starts with /api, normalize it
    const fullPath = this.baseUrl.endsWith('/api') && cleanPath.startsWith('/api')
      ? `${this.baseUrl}${cleanPath.substring(4)}`
      : `${this.baseUrl}${cleanPath}`;

    const url = new URL(fullPath);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async tryRefreshToken(): Promise<string | null> {
    if (!this.tokenProvider) return null;
    const refreshToken = this.tokenProvider.getRefreshToken();
    if (!refreshToken) {
      this.tokenProvider.clearTokens();
      this.tokenProvider.onUnauthorized?.();
      return null;
    }

    // Single-flight refresh token mutex
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const refreshUrl = this.buildUrl('/api/auth/refresh');
          const response = await fetch(refreshUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Refresh token rejected');
          }

          const data = await response.json();
          const newAccessToken = data.accessToken || data.token;
          const newRefreshToken = data.refreshToken || refreshToken;

          if (newAccessToken) {
            this.tokenProvider?.setTokens(newAccessToken, newRefreshToken);
            return newAccessToken as string;
          }
          throw new Error('No access token in refresh response');
        } catch {
          this.tokenProvider?.clearTokens();
          this.tokenProvider?.onUnauthorized?.();
          return null;
        } finally {
          this.refreshPromise = null;
        }
      })();
    }

    return this.refreshPromise;
  }

  public async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, body, headers: customHeaders, skipAuth = false, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);

    const headers = new Headers(customHeaders);

    // Set Authorization header if not skipped
    if (!skipAuth && this.tokenProvider) {
      const token = this.tokenProvider.getAccessToken();
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    let requestBody: BodyInit | undefined;

    if (body instanceof FormData) {
      // Browser automatically sets Content-Type to multipart/form-data with boundary
      requestBody = body;
    } else if (body !== undefined && body !== null) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      requestBody = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      let response = await fetch(url, {
        ...fetchOptions,
        headers,
        body: requestBody,
      });

      // Handle 401 Unauthorized by attempting token refresh once
      if (response.status === 401 && !skipAuth && this.tokenProvider) {
        const newAccessToken = await this.tryRefreshToken();
        if (newAccessToken) {
          headers.set('Authorization', `Bearer ${newAccessToken}`);
          response = await fetch(url, {
            ...fetchOptions,
            headers,
            body: requestBody,
          });
        }
      }

      if (!response.ok) {
        throw await ApiError.fromResponse(response);
      }

      // 204 No Content
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      return (await response.text()) as unknown as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw ApiError.networkError('Could not connect to the backend server');
      }
      throw new ApiError((error as Error)?.message || 'An unexpected error occurred', 500);
    }
  }

  public get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  public put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  public patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  public delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const httpClient = new HttpClient();
