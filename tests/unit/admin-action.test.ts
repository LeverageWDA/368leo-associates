import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AuthorizationError, type AdminPrincipal } from '@/server/auth/permissions';

const requireAdmin = vi.fn<() => Promise<AdminPrincipal>>();
vi.mock('@/server/auth/session', async () => {
  const { assertCan } = await import('@/server/auth/permissions');
  return {
    requireAdmin,
    requirePermission: async (p: Parameters<typeof assertCan>[1]) => {
      const principal = await requireAdmin();
      assertCan(principal, p);
      return principal;
    },
  };
});

const { adminAction } = await import('@/server/auth/action');

const principal = (role: 'OWNER' | 'EDITOR', canPublish = false): AdminPrincipal => ({
  id: '00000000-0000-4000-8000-000000000001',
  email: 'person@example.test',
  displayName: null,
  role,
  canPublish,
});

const handler = vi.fn(async (input: { title: string }) => input.title.toUpperCase());
const publish = adminAction('content.publish', z.object({ title: z.string().min(1) }), handler);
const manageAdmins = adminAction('admins.manage', z.object({ title: z.string() }), handler);

beforeEach(() => {
  requireAdmin.mockReset();
  handler.mockClear();
});

describe('adminAction', () => {
  it('rejects signed-out callers before running the handler', async () => {
    requireAdmin.mockRejectedValue(new AuthorizationError('UNAUTHENTICATED'));
    expect(await publish({ title: 'x' })).toEqual({ ok: false, error: 'UNAUTHORIZED' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects signed-in non-administrators', async () => {
    requireAdmin.mockRejectedValue(new AuthorizationError('NOT_ADMIN'));
    expect(await publish({ title: 'x' })).toEqual({ ok: false, error: 'UNAUTHORIZED' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects editors attempting owner-only actions', async () => {
    requireAdmin.mockResolvedValue(principal('EDITOR', true));
    expect(await manageAdmins({ title: 'x' })).toEqual({ ok: false, error: 'FORBIDDEN' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects editors publishing without the explicit grant', async () => {
    requireAdmin.mockResolvedValue(principal('EDITOR'));
    expect(await publish({ title: 'x' })).toEqual({ ok: false, error: 'FORBIDDEN' });
  });

  it('checks authorization before validating input', async () => {
    requireAdmin.mockResolvedValue(principal('EDITOR'));
    expect(await publish({ nonsense: true })).toEqual({ ok: false, error: 'FORBIDDEN' });
  });

  it('validates input for authorized callers', async () => {
    requireAdmin.mockResolvedValue(principal('OWNER'));
    const result = await publish({ title: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('INVALID_INPUT');
      expect(result.fieldErrors?.title).toBeDefined();
    }
    expect(handler).not.toHaveBeenCalled();
  });

  it('runs the handler for authorized, valid calls', async () => {
    requireAdmin.mockResolvedValue(principal('OWNER'));
    expect(await publish({ title: 'ep' })).toEqual({ ok: true, data: 'EP' });
  });

  it('hides internal errors from the caller', async () => {
    requireAdmin.mockResolvedValue(principal('OWNER'));
    handler.mockRejectedValueOnce(new Error('connection string postgres://secret'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await publish({ title: 'ep' })).toEqual({ ok: false, error: 'FAILED' });
    expect(JSON.stringify(spy.mock.calls)).not.toContain('secret');
    spy.mockRestore();
  });
});
