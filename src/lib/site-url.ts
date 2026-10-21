/** Public canonical origin. Safe for client and server: NEXT_PUBLIC_* only. */
export function publicSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return url.replace(/\/+$/, '');
}
