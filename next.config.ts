import type { NextConfig } from 'next';

/*
 * Content-Security-Policy. Next.js inlines bootstrap scripts, so without
 * per-request nonces (which would force every page to render dynamically)
 * script-src needs 'unsafe-inline'. Everything else is locked down; see
 * docs/security.md for the trade-off and the nonce upgrade path.
 * Clerk origins are only needed on admin pages but are harmless elsewhere.
 * CLERK_FRONTEND_API_ORIGIN is the production Clerk domain (e.g.
 * https://clerk.<label-domain>), set once the label's domain is confirmed.
 */
const clerk = ['https://*.clerk.accounts.dev', 'https://*.clerk.com', process.env.CLERK_FRONTEND_API_ORIGIN]
  .filter(Boolean)
  .join(' ');
const isDev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${clerk} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com",
  "font-src 'self'",
  "media-src 'self' blob:",
  `connect-src 'self' ${clerk}`,
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const noIndex = [
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
  { key: 'Cache-Control', value: 'private, no-store' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: { globalNotFound: true },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/admin/:path*', headers: noIndex },
      { source: '/admin', headers: noIndex },
      { source: '/sign-in/:path*', headers: noIndex },
      { source: '/preview/:path*', headers: noIndex },
    ];
  },
};

export default nextConfig;
