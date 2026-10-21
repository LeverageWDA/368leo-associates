import type { AdminRole } from '@/server/db/schema';

/*
 * Role -> permission matrix. This is the single source of truth for what an
 * administrator may do; every server mutation checks it via requirePermission.
 */
export const PERMISSIONS = [
  'content.edit', // artists, releases, tracks, credits, website copy (drafts)
  'content.preview',
  'content.publish',
  'content.archive',
  'media.upload',
  'media.delete',
  'platform_links.manage', // Apple Music, Shopify and other verified destinations
  'admins.manage',
  'settings.manage',
  'integrations.view',
  'audit.view',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export interface AdminPrincipal {
  id: string;
  email: string;
  displayName: string | null;
  role: AdminRole;
  canPublish: boolean;
}

const EDITOR_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>([
  'content.edit',
  'content.preview',
  'media.upload',
]);

export function can(principal: Pick<AdminPrincipal, 'role' | 'canPublish'>, permission: Permission): boolean {
  if (principal.role === 'OWNER') return true;
  if (principal.role === 'EDITOR') {
    // Publishing is off for editors unless an owner has granted it explicitly.
    if (permission === 'content.publish') return principal.canPublish;
    return EDITOR_PERMISSIONS.has(permission);
  }
  return false;
}

export type AuthFailure = 'UNAUTHENTICATED' | 'NOT_ADMIN' | 'FORBIDDEN' | 'AUTH_NOT_CONFIGURED';

export class AuthorizationError extends Error {
  constructor(readonly reason: AuthFailure) {
    super(reason);
    this.name = 'AuthorizationError';
  }
}

export function assertCan(principal: AdminPrincipal, permission: Permission): void {
  if (!can(principal, permission)) throw new AuthorizationError('FORBIDDEN');
}
