import 'server-only';
import type { Artist, Release, SiteSettings } from '@/lib/catalog';
import { FIXTURE_ARTISTS, FIXTURE_RELEASES } from './fixtures';

/*
 * The public site's only read API for catalogue and site content. Every
 * function returns published, approved content only.
 *
 * Sources today:
 * - Development fixtures, when ENABLE_DEV_FIXTURES=1 and not a production
 *   deployment. Clearly labelled; never shown on the live site.
 * - Otherwise nothing yet: pages render their empty states. The database
 *   source (published rows only) replaces this when content management lands,
 *   without changing these signatures.
 */

export function devFixturesEnabled(): boolean {
  return process.env.ENABLE_DEV_FIXTURES === '1' && process.env.VERCEL_ENV !== 'production';
}

const releases = (): Release[] => (devFixturesEnabled() ? FIXTURE_RELEASES : []);
const artists = (): Artist[] => (devFixturesEnabled() ? FIXTURE_ARTISTS : []);

export async function getReleases(): Promise<Release[]> {
  return releases();
}

export async function getRelease(slug: string): Promise<Release | null> {
  return releases().find(r => r.slug === slug) ?? null;
}

/** The release the homepage features. Today: the first published release. */
export async function getFeaturedRelease(): Promise<Release | null> {
  return releases()[0] ?? null;
}

export async function getArtists(): Promise<Artist[]> {
  return artists();
}

export async function getArtist(slug: string): Promise<Artist | null> {
  return artists().find(a => a.slug === slug) ?? null;
}

export async function getReleasesByArtist(slug: string): Promise<Release[]> {
  return releases().filter(r => r.artist.slug === slug);
}

/** Social links, contact routes and store URL. Empty until verified by the label. */
export async function getSiteSettings(): Promise<SiteSettings> {
  return { socials: [], contact: [], shopifyStoreUrl: null };
}
