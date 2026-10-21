import 'server-only';
import { cache } from 'react';
import { getDb } from '@/server/db/client';
import { isClerkConfigured } from '@/server/env';
import { resolveAdmin, type SignedInIdentity } from './admin-access';
import { AuthorizationError, assertCan, type AdminPrincipal, type Permission } from './permissions';

async function currentIdentity(): Promise<SignedInIdentity | null> {
  if (!isClerkConfigured()) throw new AuthorizationError('AUTH_NOT_CONFIGURED');
  // Imported lazily so the public site never loads Clerk server code.
  const { auth, currentUser } = await import('@clerk/nextjs/server');
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  if (!user) return null;
  return {
    clerkUserId: userId,
    verifiedEmails: user.emailAddresses
      .filter(e => e.verification?.status === 'verified')
      .map(e => e.emailAddress),
  };
}

/**
 * The administrator for this request, or an AuthorizationError. Cached per
 * request so a page and its server components share one lookup.
 */
export const requireAdmin = cache(async (): Promise<AdminPrincipal> => {
  const identity = await currentIdentity();
  if (!identity) throw new AuthorizationError('UNAUTHENTICATED');
  const result = await resolveAdmin(getDb(), identity);
  if (!result.ok) throw new AuthorizationError(result.reason);
  return result.principal;
});

/** Use at the top of every server action and admin route handler. */
export async function requirePermission(permission: Permission): Promise<AdminPrincipal> {
  const principal = await requireAdmin();
  assertCan(principal, permission);
  return principal;
}
