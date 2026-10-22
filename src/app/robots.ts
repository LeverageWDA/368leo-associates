import type { MetadataRoute } from 'next';
import { publicSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/sign-in', '/preview', '/api', '/dev', '/dev-fixtures'] },
    sitemap: `${publicSiteUrl()}/sitemap.xml`,
  };
}
