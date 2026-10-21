# Setup: database, sign-in and the first owner

This guide connects Supabase (database) and Clerk (sign-in) so the label owner
can reach `/admin`. Until both are configured, the public site works and every
admin route returns 503 (fail closed).

Nothing here deploys to production or touches the live domain. Use a Clerk
**development** instance and a Supabase project created for development.

## 1. Supabase (database)

1. Create a Supabase project. Pick the region closest to most listeners.
   - Free plan projects **pause after 7 days of low activity**. Fine for
     development; production needs a paid plan or the public site will go down
     once pages read from the database.
2. In **Project Settings → Database**, copy two connection strings:
   - **Session pooler (port 5432), user `postgres`** → `MIGRATION_DATABASE_URL`.
     Owner rights; used only for migrations and owner provisioning.
   - **Transaction pooler (port 6543)** → template for `DATABASE_URL` (step 5).
3. Apply migrations from your machine:

   ```bash
   MIGRATION_DATABASE_URL='postgres://…:5432/postgres' npm run db:migrate
   ```

   This creates the tables, enables Row Level Security on all of them, revokes
   Supabase API (`anon`, `authenticated`) access, makes `audit_logs`
   append-only, and creates the runtime role `leo_app` **without** a password.
4. Give `leo_app` a login. In the Supabase SQL editor (use a long random
   password and keep it in a password manager):

   ```sql
   ALTER ROLE leo_app WITH LOGIN PASSWORD '<generated-password>';
   ```

5. Build `DATABASE_URL` from the transaction-pooler string, replacing the user
   and password with `leo_app` and its password. Pooler usernames include the
   project ref (shown in the dashboard's connection string), so the user part
   is expected to be `leo_app.<project-ref>`. **Confirm this in the dashboard's
   Connect panel.**
6. Check **Advisors → Security** in the dashboard: no table should be reported
   as exposed without RLS.

### What `leo_app` can and cannot do

| Can | Cannot |
| --- | --- |
| Read/insert/update content tables | Run DDL (create/alter/drop) |
| Delete draft child rows: tracks, credits, platform links | Delete releases, artists, media records or admins |
| Insert and read audit logs | Update or delete audit logs |

The application checks the administrator's role before every mutation; the
database role limits damage if application code has a bug.

### Backups

Before real content goes in, decide on backups: check what the chosen Supabase
plan includes (daily backups / point-in-time recovery) and schedule a periodic
`pg_dump` with `MIGRATION_DATABASE_URL` to storage the label controls. Media
files (Phase 3) need their own backup.

## 2. Clerk (sign-in)

1. Create a Clerk application and use its **Development** instance.
2. Sign-in options: enable **Email** (email code or password). Disable social
   providers unless the label wants them.
3. **Restrictions → Sign-up mode: Restricted.** Nobody can create an account on
   their own. Our database also refuses anyone who wasn't invited, so this is a
   second lock, not the only one.
4. Copy the keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (public, safe in the browser)
   - `CLERK_SECRET_KEY` (server only, never in client code or logs)
5. In Clerk, invite (or create) the owner's user with the **same email** that
   will be provisioned in step 3.

A production Clerk instance requires DNS records on the label's domain. That is
a change to the live domain and needs explicit approval first.

## 3. First owner

Owners are created from the command line only; there is no web endpoint for it.

```bash
MIGRATION_DATABASE_URL='postgres://…:5432/postgres' \
  npm run admin:provision-owner -- --email owner@label-domain --name "Owner Name"
```

This creates an `invited` OWNER record. On first sign-in with that email
**verified** in Clerk, the record is bound to that Clerk user, becomes `active`,
and an `admin.identity_linked` audit entry is written. The binding happens once;
another Clerk account with the same address later is refused. The command
refuses to add a second owner unless `--additional` is passed.

## 4. Run locally

```bash
cp .env.example .env.local   # fill in the four values above
npm install
npm run dev                   # http://localhost:3000, admin at /admin
```

## 5. Verify

```bash
npm run typecheck && npm run lint
npm test                      # unit
npm run test:integration      # needs a local Postgres (TEST_DATABASE_ADMIN_URL)
npm run build && npm run check:bundle-secrets
npm run test:e2e              # runs against `next start` with no credentials
```

## Security notes

- **CSRF:** server actions are protected by Next.js's Origin/Host check. Cookie
  -authenticated route handlers must call `isSameOrigin()`
  (`src/server/auth/same-origin.ts`).
- **CSP:** `script-src` includes `'unsafe-inline'` because Next.js inlines
  bootstrap scripts on statically rendered pages. Switching to per-request
  nonces removes it but makes every page render dynamically; revisit in the
  hardening phase.
- **Secrets:** only `NEXT_PUBLIC_*` values reach the browser. `npm run
  check:bundle-secrets` fails the build check if a secret pattern or the value
  of a server-only variable appears in `.next/static`.
