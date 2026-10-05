import { afterEach, expect, it, vi } from 'vitest';
import { httpClient } from '../services/api/httpClient';
import { shareService } from '../services/shareService';
import { pageService } from '../services/pageService';
import { workspaceService } from '../services/workspaceService';
import { authService } from '../services/authService';
import { usePageStore } from '../stores/pageStore';
import type { Page } from '../types/page';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it('public-page service sends no authorization header', async () => {
  httpClient.setTokenProvider({ getAccessToken: () => 'private', getRefreshToken: () => 'private', setTokens: vi.fn(), clearTokens: vi.fn() });
  const fetcher = vi.fn(async (_url: string, _options: RequestInit) => new Response(JSON.stringify({ id: 'public', content: '{}' }), { headers: { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fetcher);
  await shareService.getPublicPage('public');
  expect(fetcher.mock.calls[0][0]).toContain('/api/public/pages/public');
  expect(new Headers(fetcher.mock.calls[0][1].headers).has('Authorization')).toBe(false);
});

it('editor content uses the version-producing content endpoint', async () => {
  const put = vi.spyOn(httpClient, 'put').mockResolvedValue({ id: 'page', content: '{}' });
  await pageService.updatePageContent('page', '{}');
  expect(put).toHaveBeenCalledWith('/api/pages/page/content', { content: '{}' });
});

it('workspace updates use PATCH and logout revokes server state', async () => {
  const patch = vi.spyOn(httpClient, 'patch').mockResolvedValue({ id: 'ws', name: 'Updated' });
  await workspaceService.updateWorkspace('ws', { name: 'Updated' });
  expect(patch.mock.calls[0][0]).toBe('/api/workspaces/ws');
  const post = vi.spyOn(httpClient, 'post').mockResolvedValue(undefined);
  await authService.revokeToken('refresh');
  expect(post).toHaveBeenCalledWith('/api/auth/logout', { refreshToken: 'refresh' }, { skipAuth: true });
});

it('child restore replaces cached ancestor state with backend results', async () => {
  const ancestor = { id: 'root', workspaceId: 'ws', isArchived: true } as Page;
  const child = { id: 'child', workspaceId: 'ws', parentId: 'root', isArchived: true } as Page;
  usePageStore.setState({ pages: [ancestor, child] });
  vi.spyOn(pageService, 'restorePage').mockResolvedValue({ ...child, isArchived: false });
  vi.spyOn(pageService, 'getPages').mockResolvedValue([{ ...ancestor, isArchived: false }, { ...child, isArchived: false }]);
  vi.spyOn(pageService, 'getTrash').mockResolvedValue([]);
  await usePageStore.getState().restorePage('child');
  expect(usePageStore.getState().pages.every((page) => !page.isArchived)).toBe(true);
});
