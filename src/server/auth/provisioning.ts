import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Database } from '@/server/db/client';
import { adminUsers } from '@/server/db/schema';
import { writeAudit } from '@/server/audit/log';

export const provisionOwnerInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  displayName: z.string().trim().min(1).max(120).optional(),
  /** Required to add a second owner once one is active. */
  allowAdditionalOwner: z.boolean().default(false),
});

export type ProvisionOwnerResult =
  | { ok: true; adminId: string }
  | { ok: false; error: 'OWNER_EXISTS' | 'EMAIL_EXISTS' };

/**
 * Creates an `invited` OWNER record. This is the only path to the first owner
 * and is run by an operator from the command line (scripts/provision-owner.ts),
 * never through a web endpoint. The person gains access once they sign in with
 * this email verified in Clerk.
 */
export async function provisionOwner(
  db: Database,
  rawInput: z.input<typeof provisionOwnerInput>,
): Promise<ProvisionOwnerResult> {
  const input = provisionOwnerInput.parse(rawInput);

  return db.transaction(async tx => {
    // Serialize concurrent provisioning attempts.
    await tx.execute(`SELECT pg_advisory_xact_lock(hashtext('leo.provision_owner'))`);

    if (!input.allowAdditionalOwner) {
      const [owner] = await tx
        .select({ id: adminUsers.id })
        .from(adminUsers)
        .where(and(eq(adminUsers.role, 'OWNER'), eq(adminUsers.status, 'active')))
        .limit(1);
      if (owner) return { ok: false as const, error: 'OWNER_EXISTS' as const };
    }

    const inserted = await tx
      .insert(adminUsers)
      .values({ email: input.email, displayName: input.displayName ?? null, role: 'OWNER', status: 'invited' })
      .onConflictDoNothing()
      .returning({ id: adminUsers.id });
    const row = inserted[0];
    if (!row) return { ok: false as const, error: 'EMAIL_EXISTS' as const };

    await writeAudit(tx, {
      action: 'admin.owner_provisioned',
      entityType: 'admin_user',
      entityId: row.id,
      metadata: { via: 'cli' },
    });
    return { ok: true as const, adminId: row.id };
  });
}
