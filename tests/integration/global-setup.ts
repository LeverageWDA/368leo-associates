import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { ADMIN_URL, APP_ROLE_PASSWORD, TEST_DB, testUrl } from './db';

/*
 * Recreates the test database, simulates Supabase's API roles (anon,
 * authenticated) so RLS behaviour is exercised, then applies the real
 * migrations exactly as production would.
 */
export default async function setup() {
  const admin = postgres(ADMIN_URL, { max: 1, onnotice: () => {} });
  await admin.unsafe(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await admin.unsafe(`CREATE DATABASE ${TEST_DB}`);
  for (const role of ['anon', 'authenticated']) {
    await admin.unsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='${role}') THEN CREATE ROLE ${role} NOLOGIN; END IF; END $$`);
  }
  await admin.end();

  const db = postgres(testUrl(), { max: 1, onnotice: () => {} });
  // Supabase grants the API roles broad table access by default; reproduce that
  // so the migration's REVOKE + RLS is what actually protects the data.
  await db.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated; GRANT USAGE ON SCHEMA public TO anon, authenticated;`);
  await migrate(drizzle(db), { migrationsFolder: 'drizzle' });
  await db.unsafe(`ALTER ROLE leo_app WITH LOGIN PASSWORD '${APP_ROLE_PASSWORD}'`);
  // Lets the test superuser impersonate the API roles with SET ROLE.
  await db.end();
}
