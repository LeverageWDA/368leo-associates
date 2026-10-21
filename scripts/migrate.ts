/*
 * Applies drizzle/ migrations. Uses MIGRATION_DATABASE_URL (a schema-owner
 * connection) when set, falling back to DATABASE_URL for local development.
 * The runtime leo_app role cannot run DDL, by design.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error('Set MIGRATION_DATABASE_URL (or DATABASE_URL) before running migrations.');
  process.exit(1);
}

const client = postgres(url, { max: 1, onnotice: () => {} });
try {
  await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
  console.log('Migrations applied.');
} finally {
  await client.end();
}
