import type { MetadataRoute } from 'next';
import { publicSiteUrl } from '@/lib/site-url';

// Phase 4 adds published release pages from the database.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${publicSiteUrl()}/` }];
}
