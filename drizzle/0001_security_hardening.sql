-- Security hardening (hand-written migration).
--
-- 1. audit_logs is append-only.
-- 2. Row Level Security is enabled on every table. No policies exist for the
--    Supabase API roles (anon, authenticated), so the auto-generated REST/GraphQL
--    API cannot read or write this data even if the anon key leaks.
-- 3. A least-privilege runtime role, leo_app, is created WITHOUT login. An
--    operator enables it out-of-band (see docs/database.md) so no password ever
--    lives in a migration. The application authorizes every operation itself;
--    the role limits blast radius (no DDL, no deletes of published records,
--    no audit-log tampering).

CREATE OR REPLACE FUNCTION audit_logs_reject_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$;--> statement-breakpoint
CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_reject_mutation();--> statement-breakpoint
CREATE TRIGGER audit_logs_no_truncate
  BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_reject_mutation();--> statement-breakpoint

DO $$
DECLARE t text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'leo_app') THEN
    CREATE ROLE leo_app NOLOGIN NOINHERIT;
  END IF;

  FOREACH t IN ARRAY ARRAY['admin_users','media_assets','artists','releases','tracks',
                           'release_credits','platform_links','site_content','audit_logs']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO leo_app USING (true) WITH CHECK (true)',
                   t || '_leo_app_all', t);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE %I FROM anon', t);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON TABLE %I FROM authenticated', t);
    END IF;
  END LOOP;
END
$$;--> statement-breakpoint

GRANT USAGE ON SCHEMA public TO leo_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON admin_users, media_assets, artists, releases, tracks,
  release_credits, platform_links, site_content TO leo_app;--> statement-breakpoint
-- Deletes are limited to child rows edited as part of a draft (Phase 2 enforces
-- the draft-only rule in the domain layer).
GRANT DELETE ON tracks, release_credits, platform_links TO leo_app;--> statement-breakpoint
GRANT SELECT, INSERT ON audit_logs TO leo_app;
