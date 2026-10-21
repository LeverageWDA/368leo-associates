import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/server/db/schema';
import type { Database } from '@/server/db/client';

export const ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres';
export const TEST_DB = 'leo_test';
export const testUrl = (user = 'postgres', password = 'postgres') => {
  const u = new URL(ADMIN_URL);
  u.username = user;
  u.password = password;
  u.pathname = `/${TEST_DB}`;
  return u.toString();
};
export const APP_ROLE_PASSWORD = 'leo_app_test_only';

export function connect(url = testUrl()) {
  const sql = postgres(url, { max: 2, onnotice: () => {} });
  return { sql, db: drizzle(sql, { schema }) as unknown as Database };
}

export async function resetData(sql: postgres.Sql) {
  // audit_logs refuses TRUNCATE by design; drop the trigger only for test resets.
  await sql.unsafe(`
    ALTER TABLE audit_logs DISABLE TRIGGER audit_logs_no_truncate;
    TRUNCATE audit_logs, release_credits, platform_links, tracks, releases, artists, site_content, media_assets, admin_users CASCADE;
    ALTER TABLE audit_logs ENABLE TRIGGER audit_logs_no_truncate;
  `);
}
