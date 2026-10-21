/*
 * Fails if anything secret-looking ended up in the browser bundle
 * (.next/static). Run after `next build`. Checks both known secret patterns
 * and the literal values of server-only environment variables when present.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = '.next/static';
const SERVER_ONLY_VARS = ['DATABASE_URL', 'MIGRATION_DATABASE_URL', 'CLERK_SECRET_KEY', 'CLERK_WEBHOOK_SECRET', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'POSTHOG_PERSONAL_API_KEY'];
const PATTERNS: [string, RegExp][] = [
  ['Postgres connection string', /postgres(?:ql)?:\/\/[^\s"'`]+:[^\s"'`]+@/],
  ['Clerk secret key', /\bsk_(?:live|test)_[A-Za-z0-9]{10,}/],
  ['Supabase service role reference', /service_role/],
  // A server variable name paired with a value (e.g. a serialized env object).
  // Bare references such as `process.env.CLERK_SECRET_KEY` inside third-party
  // client code are not leaks: in the browser they read an empty object.
  ['Server env var with value', new RegExp(`["']?\\b(?:${SERVER_ONLY_VARS.join('|')})\\b["']?\\s*[:=]\\s*["'][^"']{6,}`)],
];

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(js|css|html|json|txt|map)$/.test(name)) yield p;
  }
}

const secretValues = SERVER_ONLY_VARS.map(v => [v, process.env[v]] as const).filter(
  (e): e is readonly [string, string] => typeof e[1] === 'string' && e[1].length >= 8,
);

let findings = 0;
let scanned = 0;
for (const file of files(ROOT)) {
  scanned++;
  const text = readFileSync(file, 'utf8');
  for (const [label, re] of PATTERNS) {
    if (re.test(text)) {
      console.error(`✗ ${label} in ${file}`);
      findings++;
    }
  }
  for (const [name, value] of secretValues) {
    if (text.includes(value)) {
      console.error(`✗ value of ${name} in ${file}`);
      findings++;
    }
  }
}

if (scanned === 0) {
  console.error(`No files found under ${ROOT}; run "next build" first.`);
  process.exit(1);
}
console.log(`Scanned ${scanned} client files; checked ${secretValues.length} secret values.`);
process.exit(findings > 0 ? 1 : 0);
