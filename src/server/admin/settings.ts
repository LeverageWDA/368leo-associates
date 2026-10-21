import 'server-only';
import { asc } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { adminUsers } from '@/server/db/schema';
import { isClerkConfigured, serverEnv } from '@/server/env';

export async function listAdministrators() {
  return getDb()
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
      status: adminUsers.status,
      canPublish: adminUsers.canPublish,
      lastSignInAt: adminUsers.lastSignInAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.role), asc(adminUsers.email));
}

export type IntegrationState = 'connected' | 'not_configured' | 'planned';

/** Reports whether integrations are configured. Never returns secret values. */
export function integrationStatus(): { name: string; state: IntegrationState; detail: string }[] {
  const env = serverEnv();
  return [
    { name: 'Database (Supabase Postgres)', state: env.DATABASE_URL ? 'connected' : 'not_configured', detail: 'Content and administrator records.' },
    { name: 'Sign-in (Clerk)', state: isClerkConfigured() ? 'connected' : 'not_configured', detail: 'Administrator authentication.' },
    { name: 'Media storage', state: 'planned', detail: 'Artwork and audio files — Phase 3.' },
    { name: 'Analytics (PostHog)', state: 'planned', detail: 'Visits, plays and outbound clicks — Phase 5.' },
    { name: 'Shopify', state: 'planned', detail: 'External product links only; no checkout or store access — Phase 5.' },
  ];
}
