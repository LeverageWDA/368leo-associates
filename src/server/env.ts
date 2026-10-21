import 'server-only';
import { z } from 'zod';

/*
 * Server environment, validated once on first use.
 *
 * Optional integrations (Clerk) are allowed to be absent so the public site can
 * build and run before credentials exist; anything that depends on them must
 * fail closed when they are missing. DATABASE_URL is checked when the database
 * is first used, not at import, so a build without a database still succeeds.
 */
const optional = (schema: z.ZodString) =>
  z.preprocess(v => (typeof v === 'string' && v.trim() === '' ? undefined : v), schema.optional());

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: optional(z.string().url().startsWith('postgres')),
  CLERK_SECRET_KEY: optional(z.string().startsWith('sk_')),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optional(z.string().startsWith('pk_')),
  NEXT_PUBLIC_SITE_URL: optional(z.string().url()),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Report which variables are invalid without echoing their values.
    const names = [...new Set(parsed.error.issues.map(i => i.path.join('.')))].join(', ');
    throw new Error(`Invalid server environment variables: ${names}`);
  }
  cached = parsed.data;
  return cached;
}

/** Clerk is usable only when both keys are present. */
export function isClerkConfigured(env: ServerEnv = serverEnv()): boolean {
  return Boolean(env.CLERK_SECRET_KEY && env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export function requireDatabaseUrl(env: ServerEnv = serverEnv()): string {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return env.DATABASE_URL;
}
