import 'server-only';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { requireDatabaseUrl } from '@/server/env';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

// Reuse one pool per server instance (and across dev hot reloads).
const globalForDb = globalThis as unknown as { leoDb?: Database };

export function getDb(): Database {
  if (globalForDb.leoDb) return globalForDb.leoDb;
  const client = postgres(requireDatabaseUrl(), {
    max: 5,
    // Supabase's transaction pooler (port 6543) does not support prepared statements.
    prepare: false,
  });
  globalForDb.leoDb = drizzle(client, { schema });
  return globalForDb.leoDb;
}
