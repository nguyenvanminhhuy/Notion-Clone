import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpClient, type TokenProvider } from '../services/api/httpClient';

afterEach(() => vi.unstubAllGlobals());
function setup() {
  const client = new HttpClient('https://api.example.test');
  let accessToken = 'expired';
  const provider: TokenProvider = {
    getAccessToken: () => accessToken, getRefreshToken: () => 'refresh',
    setTokens: vi.fn((access) => { accessToken = access; }), clearTokens: vi.fn(), onUnauthorized: vi.fn(),
  };
  client.setTokenProvider(provider);
  return { client, provider };
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('HTTP authentication', () => {
  it('performs a single refresh for concurrent 401s then retries both requests', async () => {
    const { client, provider } = setup();
    const fetcher = vi.fn(async (url: string, options: RequestInit) => {
      if (url.endsWith('/api/auth/refresh')) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return json({ accessToken: 'new', refreshToken: 'rotated' });
      }
      return new Headers(options.headers).get('Authorization') === 'Bearer new'
        ? json({ saved: true }) : json({}, 401);
    });
    vi.stubGlobal('fetch', fetcher);
    const responses = await Promise.all([client.get('/api/pages/a'), client.get('/api/pages/b')]);
    expect(responses).toEqual([{ saved: true }, { saved: true }]);
    expect(fetcher.mock.calls.filter(([url]) => url.endsWith('/api/auth/refresh'))).toHaveLength(1);
    expect(provider.setTokens).toHaveBeenCalledWith('new', 'rotated');
  });

  it('does not recurse when refresh is rejected', async () => {
    const { client, provider } = setup();
    const fetcher = vi.fn(async () => json({}, 401));
    vi.stubGlobal('fetch', fetcher);
    await expect(client.get('/api/pages/a')).rejects.toMatchObject({ statusCode: 401 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(provider.clearTokens).toHaveBeenCalledOnce();
  });

  it('does not attach tokens or refresh an anonymous request', async () => {
    const { client } = setup();
    const fetcher = vi.fn(async (_url: string, _options: RequestInit) => json({}, 401));
    vi.stubGlobal('fetch', fetcher);
    await expect(client.get('/api/public/pages/a', { skipAuth: true })).rejects.toMatchObject({ statusCode: 401 });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(new Headers((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].headers).has('Authorization')).toBe(false);
  });
});
