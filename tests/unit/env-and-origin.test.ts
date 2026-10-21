import { afterEach, describe, expect, it, vi } from 'vitest';
import { isSameOrigin } from '@/server/auth/same-origin';

describe('isSameOrigin', () => {
  const req = (headers: Record<string, string>) => new Request('https://site.test/api/admin/x', { method: 'POST', headers });

  it('accepts matching origin', () => {
    expect(isSameOrigin(req({ origin: 'https://site.test', host: 'site.test' }))).toBe(true);
  });
  it('rejects a foreign origin', () => {
    expect(isSameOrigin(req({ origin: 'https://evil.test', host: 'site.test' }))).toBe(false);
  });
  it('rejects a missing origin', () => {
    expect(isSameOrigin(req({ host: 'site.test' }))).toBe(false);
  });
  it('rejects a malformed origin', () => {
    expect(isSameOrigin(req({ origin: 'null', host: 'site.test' }))).toBe(false);
  });
});

describe('serverEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('treats blank optional values as absent and reports Clerk unconfigured', async () => {
    vi.stubEnv('CLERK_SECRET_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', '');
    const { isClerkConfigured } = await import('@/server/env');
    expect(isClerkConfigured()).toBe(false);
  });

  it('rejects malformed values without echoing them', async () => {
    vi.stubEnv('DATABASE_URL', 'not-a-url-SECRETVALUE');
    const { serverEnv } = await import('@/server/env');
    expect(() => serverEnv()).toThrow(/DATABASE_URL/);
    expect(() => serverEnv()).not.toThrow(/SECRETVALUE/);
  });

  it('requires both Clerk keys', async () => {
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_x');
    vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', '');
    const { isClerkConfigured } = await import('@/server/env');
    expect(isClerkConfigured()).toBe(false);
  });
});
