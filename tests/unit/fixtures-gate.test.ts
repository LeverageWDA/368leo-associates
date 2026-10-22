import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const load = () => import('@/server/content/repository');

describe('development fixtures gate', () => {
  it('is off by default: no releases, artists or featured release', async () => {
    vi.stubEnv('ENABLE_DEV_FIXTURES', '');
    const repo = await load();
    expect(repo.devFixturesEnabled()).toBe(false);
    expect(await repo.getReleases()).toEqual([]);
    expect(await repo.getArtists()).toEqual([]);
    expect(await repo.getFeaturedRelease()).toBeNull();
    expect(await repo.getRelease('dev-fixture-ep')).toBeNull();
  });

  it('can never be switched on in a production deployment', async () => {
    vi.stubEnv('ENABLE_DEV_FIXTURES', '1');
    vi.stubEnv('VERCEL_ENV', 'production');
    const repo = await load();
    expect(repo.devFixturesEnabled()).toBe(false);
    expect(await repo.getReleases()).toEqual([]);
  });

  it('when enabled, every item is flagged as a fixture', async () => {
    vi.stubEnv('ENABLE_DEV_FIXTURES', '1');
    const repo = await load();
    const releases = await repo.getReleases();
    expect(releases.length).toBeGreaterThan(0);
    expect(releases.every(r => r.isFixture)).toBe(true);
    expect((await repo.getArtists()).every(a => a.isFixture)).toBe(true);
    // fixture links only ever point at the reserved example.com domain
    expect(releases.flatMap(r => r.links).every(l => new URL(l.url).hostname === 'example.com')).toBe(true);
  });

  it('never invents social links, contacts or a store URL', async () => {
    vi.stubEnv('ENABLE_DEV_FIXTURES', '1');
    const repo = await load();
    expect(await repo.getSiteSettings()).toEqual({ socials: [], contact: [], shopifyStoreUrl: null });
  });
});
