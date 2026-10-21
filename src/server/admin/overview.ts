import 'server-only';
import { count, desc, eq } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { adminUsers, auditLogs, releases } from '@/server/db/schema';

export interface RecentChange {
  id: string;
  action: string;
  entityType: string;
  createdAt: Date;
  actor: string | null;
}

export async function getOverview() {
  const db = getDb();
  const [published] = await db.select({ n: count() }).from(releases).where(eq(releases.status, 'published'));
  const recent: RecentChange[] = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      createdAt: auditLogs.createdAt,
      actor: adminUsers.displayName,
    })
    .from(auditLogs)
    .leftJoin(adminUsers, eq(auditLogs.actorAdminId, adminUsers.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(8);

  return {
    publishedReleases: published?.n ?? 0,
    // Engagement metrics come from PostHog (Phase 5). Until it is connected they
    // are reported as unavailable, never as zero.
    analytics: { pageViews: null, plays: null, shopifyClicks: null } as const,
    recent,
  };
}
