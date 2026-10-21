/*
 * Explicit owner provisioning. Run by an operator with database access:
 *
 *   MIGRATION_DATABASE_URL=... npm run admin:provision-owner -- --email owner@example.com [--name "Name"] [--additional]
 *
 * Creates an `invited` OWNER record. The person gets access only after signing
 * in through Clerk with that email address verified. Refuses to add a second
 * owner unless --additional is passed.
 */
import { parseArgs } from 'node:util';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/server/db/schema';
import { provisionOwner } from '../src/server/auth/provisioning';

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
    additional: { type: 'boolean', default: false },
  },
});

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url || !values.email) {
  console.error('Usage: MIGRATION_DATABASE_URL=... npm run admin:provision-owner -- --email <address> [--name <name>] [--additional]');
  process.exit(1);
}

const client = postgres(url, { max: 1, prepare: false });
try {
  const result = await provisionOwner(drizzle(client, { schema }), {
    email: values.email,
    displayName: values.name,
    allowAdditionalOwner: values.additional,
  });
  if (result.ok) {
    console.log(`Owner invited (id ${result.adminId}). They can now sign in at /sign-in with that verified email.`);
  } else if (result.error === 'OWNER_EXISTS') {
    console.error('An active owner already exists. Pass --additional to invite another owner deliberately.');
    process.exitCode = 1;
  } else {
    console.error('An administrator with that email already exists.');
    process.exitCode = 1;
  }
} finally {
  await client.end();
}
