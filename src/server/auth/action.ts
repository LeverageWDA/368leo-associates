import 'server-only';
import type { z } from 'zod';
import { AuthorizationError, type AdminPrincipal, type Permission } from './permissions';
import { requirePermission } from './session';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_INPUT' | 'FAILED'; fieldErrors?: Record<string, string[]> };

/**
 * Wraps a server action so authorization and validation happen at the
 * operation boundary, in that order, before any business logic runs.
 * Next.js already rejects server-action POSTs whose Origin does not match the
 * host, which is our CSRF protection for actions (see docs/security.md).
 */
export function adminAction<S extends z.ZodType, T>(
  permission: Permission,
  schema: S,
  handler: (input: z.output<S>, principal: AdminPrincipal) => Promise<T>,
) {
  return async (raw: unknown): Promise<ActionResult<T>> => {
    let principal: AdminPrincipal;
    try {
      principal = await requirePermission(permission);
    } catch (err) {
      if (err instanceof AuthorizationError) {
        return { ok: false, error: err.reason === 'FORBIDDEN' ? 'FORBIDDEN' : 'UNAUTHORIZED' };
      }
      throw err;
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_';
        (fieldErrors[key] ??= []).push(issue.message);
      }
      return { ok: false, error: 'INVALID_INPUT', fieldErrors };
    }

    try {
      return { ok: true, data: await handler(parsed.data, principal) };
    } catch (err) {
      if (err instanceof AuthorizationError) return { ok: false, error: 'FORBIDDEN' };
      // Log the failure without input values, which may contain unpublished content.
      console.error(`[admin-action] ${permission} failed:`, err instanceof Error ? err.name : 'unknown');
      return { ok: false, error: 'FAILED' };
    }
  };
}
