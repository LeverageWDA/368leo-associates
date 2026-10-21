import 'server-only';
import { redirect } from 'next/navigation';
import { Forbidden, NoAccess, NotConfigured } from '@/components/admin/StatusViews';
import { isClerkConfigured, serverEnv } from '@/server/env';
import { AuthorizationError, can, type AdminPrincipal, type Permission } from './permissions';
import { requireAdmin } from './session';

export type PageGate = { ok: true; principal: AdminPrincipal } | { ok: false; view: React.ReactElement };

/**
 * Authorization for admin pages. Layouts are not re-rendered on every client
 * navigation, so each page calls this itself rather than relying on the layout.
 *
 *   const gate = await gateAdminPage('settings.manage');
 *   if (!gate.ok) return gate.view;
 */
export async function gateAdminPage(permission?: Permission): Promise<PageGate> {
  if (!isClerkConfigured()) return { ok: false, view: <NotConfigured what="authentication" /> };
  if (!serverEnv().DATABASE_URL) return { ok: false, view: <NotConfigured what="database" /> };

  let principal: AdminPrincipal;
  try {
    principal = await requireAdmin();
  } catch (err) {
    if (!(err instanceof AuthorizationError)) throw err;
    if (err.reason === 'UNAUTHENTICATED') redirect('/sign-in');
    if (err.reason === 'AUTH_NOT_CONFIGURED') return { ok: false, view: <NotConfigured what="authentication" /> };
    return { ok: false, view: <NoAccess /> };
  }

  if (permission && !can(principal, permission)) return { ok: false, view: <Forbidden /> };
  return { ok: true, principal };
}
