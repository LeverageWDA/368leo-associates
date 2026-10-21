/**
 * CSRF guard for cookie-authenticated route handlers (server actions are
 * covered by Next.js). Rejects state-changing requests whose Origin header is
 * missing or does not match the request host.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
