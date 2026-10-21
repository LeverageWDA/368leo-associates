import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { resolveAdmin } from '@/server/auth/admin-access';
import { provisionOwner } from '@/server/auth/provisioning';
import { adminUsers, auditLogs } from '@/server/db/schema';
import { connect, resetData } from './db';

const { sql, db } = connect();
afterAll(() => sql.end());
beforeEach(() => resetData(sql));

describe('owner provisioning', () => {
  it('creates an invited owner and audits it', async () => {
    const result = await provisionOwner(db, { email: 'Owner@Label.test', displayName: 'Owner' });
    expect(result.ok).toBe(true);
    const [row] = await db.select().from(adminUsers);
    expect(row).toMatchObject({ email: 'owner@label.test', role: 'OWNER', status: 'invited', clerkUserId: null });
    const logs = await db.select().from(auditLogs);
    expect(logs.map(l => l.action)).toEqual(['admin.owner_provisioned']);
  });

  it('refuses a second owner unless explicitly allowed', async () => {
    await provisionOwner(db, { email: 'a@label.test' });
    await resolveAdmin(db, { clerkUserId: 'user_a', verifiedEmails: ['a@label.test'] });
    expect(await provisionOwner(db, { email: 'b@label.test' })).toEqual({ ok: false, error: 'OWNER_EXISTS' });
    expect((await provisionOwner(db, { email: 'b@label.test', allowAdditionalOwner: true })).ok).toBe(true);
  });

  it('rejects duplicate emails case-insensitively', async () => {
    await provisionOwner(db, { email: 'a@label.test' });
    expect(await provisionOwner(db, { email: 'A@LABEL.TEST', allowAdditionalOwner: true })).toEqual({ ok: false, error: 'EMAIL_EXISTS' });
  });
});

describe('resolveAdmin', () => {
  it('denies a signed-in user with no invitation (no automatic access)', async () => {
    expect(await resolveAdmin(db, { clerkUserId: 'user_x', verifiedEmails: ['someone@else.test'] })).toEqual({ ok: false, reason: 'NOT_ADMIN' });
    expect(await db.select().from(adminUsers)).toHaveLength(0);
  });

  it('binds an invited record on first verified sign-in, exactly once', async () => {
    await provisionOwner(db, { email: 'owner@label.test' });
    const first = await resolveAdmin(db, { clerkUserId: 'user_1', verifiedEmails: ['OWNER@label.test'] });
    expect(first.ok && first.principal.role).toBe('OWNER');

    const [row] = await db.select().from(adminUsers);
    expect(row).toMatchObject({ clerkUserId: 'user_1', status: 'active' });

    // A different Clerk account later verifying the same address cannot take it over.
    expect(await resolveAdmin(db, { clerkUserId: 'user_2', verifiedEmails: ['owner@label.test'] })).toEqual({ ok: false, reason: 'NOT_ADMIN' });

    // The bound account keeps working.
    expect((await resolveAdmin(db, { clerkUserId: 'user_1', verifiedEmails: [] })).ok).toBe(true);
    const actions = (await db.select().from(auditLogs)).map(l => l.action).sort();
    expect(actions).toEqual(['admin.identity_linked', 'admin.owner_provisioned']);
  });

  it('does not bind without a verified matching email', async () => {
    await provisionOwner(db, { email: 'owner@label.test' });
    expect(await resolveAdmin(db, { clerkUserId: 'user_1', verifiedEmails: [] })).toEqual({ ok: false, reason: 'NOT_ADMIN' });
  });

  it('denies disabled administrators', async () => {
    await provisionOwner(db, { email: 'owner@label.test' });
    await resolveAdmin(db, { clerkUserId: 'user_1', verifiedEmails: ['owner@label.test'] });
    await db.update(adminUsers).set({ status: 'disabled' }).where(eq(adminUsers.clerkUserId, 'user_1'));
    expect(await resolveAdmin(db, { clerkUserId: 'user_1', verifiedEmails: ['owner@label.test'] })).toEqual({ ok: false, reason: 'NOT_ADMIN' });
  });

  it('takes the role from the database, not the identity provider', async () => {
    await db.insert(adminUsers).values({ email: 'ed@label.test', role: 'EDITOR', status: 'invited' });
    const r = await resolveAdmin(db, { clerkUserId: 'user_e', verifiedEmails: ['ed@label.test'] });
    expect(r.ok && r.principal).toMatchObject({ role: 'EDITOR', canPublish: false });
  });
});
