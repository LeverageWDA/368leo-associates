import { and, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import type { Database } from '@/server/db/client';
import { adminUsers, type AdminUser } from '@/server/db/schema';
import { writeAudit } from '@/server/audit/log';
import type { AdminPrincipal } from './permissions';

/** What the identity provider (Clerk) tells us about the signed-in person. */
export interface SignedInIdentity {
  clerkUserId: string;
  /** Only addresses the provider reports as verified. */
  verifiedEmails: string[];
}

export type AdminResolution =
  | { ok: true; principal: AdminPrincipal }
  | { ok: false; reason: 'NOT_ADMIN' };

const toPrincipal = (row: AdminUser): AdminPrincipal => ({
  id: row.id,
  email: row.email,
  displayName: row.displayName,
  role: row.role,
  canPublish: row.canPublish,
});

/**
 * Maps a signed-in identity to an active administrator record.
 *
 * Access is never granted just for having an account. A person becomes an
 * administrator only if an owner (or the provisioning script) created an
 * `invited` record for their email; on first sign-in with that email verified,
 * the record is bound to their Clerk user ID exactly once. Roles always come
 * from our database, never from client-supplied or provider metadata.
 */
export async function resolveAdmin(db: Database, identity: SignedInIdentity): Promise<AdminResolution> {
  const [existing] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.clerkUserId, identity.clerkUserId))
    .limit(1);

  if (existing) {
    if (existing.status !== 'active') return { ok: false, reason: 'NOT_ADMIN' };
    await touchLastSignIn(db, existing.id);
    return { ok: true, principal: toPrincipal(existing) };
  }

  const emails = [...new Set(identity.verifiedEmails.map(e => e.trim().toLowerCase()).filter(Boolean))];
  if (emails.length === 0) return { ok: false, reason: 'NOT_ADMIN' };

  return db.transaction(async tx => {
    // The WHERE clause makes the bind single-use even under concurrent sign-ins.
    const [linked] = await tx
      .update(adminUsers)
      .set({ clerkUserId: identity.clerkUserId, status: 'active', lastSignInAt: new Date() })
      .where(
        and(
          inArray(sql`lower(${adminUsers.email})`, emails),
          eq(adminUsers.status, 'invited'),
          isNull(adminUsers.clerkUserId),
        ),
      )
      .returning();

    if (!linked) return { ok: false as const, reason: 'NOT_ADMIN' as const };

    await writeAudit(tx, {
      actorAdminId: linked.id,
      actorClerkUserId: identity.clerkUserId,
      action: 'admin.identity_linked',
      entityType: 'admin_user',
      entityId: linked.id,
      metadata: { role: linked.role },
    });
    return { ok: true as const, principal: toPrincipal(linked) };
  });
}

// At most one write per hour per administrator.
async function touchLastSignIn(db: Database, adminId: string): Promise<void> {
  await db
    .update(adminUsers)
    .set({ lastSignInAt: new Date() })
    .where(
      and(
        eq(adminUsers.id, adminId),
        or(isNull(adminUsers.lastSignInAt), lt(adminUsers.lastSignInAt, sql`now() - interval '1 hour'`)),
      ),
    );
}
