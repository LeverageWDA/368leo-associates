import type { MetadataRoute } from 'next';
import { publicSiteUrl } from '@/lib/site-url';
import { getArtists, getReleases } from '@/server/content/repository';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicSiteUrl();
  const [releases, artists] = await Promise.all([getReleases(), getArtists()]);
  return [
    ...['', '/music', '/artists', '/shop', '/about', '/contact'].map(p => ({ url: `${base}${p || '/'}` })),
    // Fixtures are never listed for search engines.
    ...releases.filter(r => !r.isFixture).map(r => ({ url: `${base}/music/${r.slug}` })),
    ...artists.filter(a => !a.isFixture).map(a => ({ url: `${base}/artists/${a.slug}` })),
  ];
}
