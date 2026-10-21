import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';

/*
 * Runs only on admin, sign-in and admin API paths (see `config.matcher`), so
 * the public site never touches Clerk.
 *
 * - Clerk configured: unauthenticated requests to /admin are sent to sign-in.
 *   Whether a signed-in person is an administrator, and what they may do, is
 *   decided server-side from our database on every page and mutation.
 * - Clerk not configured: admin paths fail closed with 503.
 */
const clerkConfigured = Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const isProtected = (req: NextRequest) => {
  const p = req.nextUrl.pathname;
  return p === '/admin' || p.startsWith('/admin/') || p.startsWith('/api/admin');
};

const withClerk = clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
});

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  if (clerkConfigured) return withClerk(req, event);
  if (isProtected(req)) {
    return new NextResponse('Admin is not available: authentication is not configured.', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/sign-in', '/sign-in/:path*', '/api/admin/:path*'],
};
