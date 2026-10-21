import postgres from 'postgres';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { APP_ROLE_PASSWORD, connect, resetData, testUrl } from './db';

const { sql } = connect();
const app = postgres(testUrl('leo_app', APP_ROLE_PASSWORD), { max: 1, onnotice: () => {} });
afterAll(async () => {
  await sql.end();
  await app.end();
});

async function seedRelease(status: 'draft' | 'published' = 'draft') {
  const [artist] = await sql`INSERT INTO artists (slug, name) VALUES ('dev-fixture-artist', 'DEV FIXTURE Artist') RETURNING id`;
  const [release] = await sql`
    INSERT INTO releases (slug, title, type, primary_artist_id, status, published_at)
    VALUES ('dev-fixture-release', 'DEV FIXTURE Release', 'ep', ${artist!.id}, ${status}, ${status === 'published' ? sql`now()` : null})
    RETURNING id`;
  return { artistId: artist!.id as string, releaseId: release!.id as string };
}

beforeEach(() => resetData(sql));

describe('Supabase API roles (RLS + revoked grants)', () => {
  it.each(['anon', 'authenticated'])('%s cannot read any content, even published', async role => {
    await seedRelease('published');
    await expect(
      sql.begin(async tx => {
        await tx.unsafe(`SET LOCAL ROLE ${role}`);
        return tx`SELECT * FROM releases`;
      }),
    ).rejects.toThrow(/permission denied/);
  });

  it('every table has row level security enabled', async () => {
    const rows = await sql`SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' AND NOT relrowsecurity`;
    expect(rows).toHaveLength(0);
  });
});

describe('least-privilege runtime role (leo_app)', () => {
  it('can read and write content', async () => {
    const { releaseId } = await seedRelease();
    await app`UPDATE releases SET description = 'x' WHERE id = ${releaseId}`;
    const [row] = await app`SELECT description FROM releases WHERE id = ${releaseId}`;
    expect(row!.description).toBe('x');
  });

  it('cannot delete releases or artists', async () => {
    const { releaseId } = await seedRelease('published');
    await expect(app`DELETE FROM releases WHERE id = ${releaseId}`).rejects.toThrow(/permission denied/);
    await expect(app`DELETE FROM artists`).rejects.toThrow(/permission denied/);
  });

  it('cannot run DDL', async () => {
    await expect(app`DROP TABLE releases`).rejects.toThrow(/must be owner|permission denied/);
  });

  it('cannot alter or remove audit history', async () => {
    await app`INSERT INTO audit_logs (action, entity_type) VALUES ('test.event', 'test')`;
    await expect(app`UPDATE audit_logs SET action = 'tampered'`).rejects.toThrow(/permission denied/);
    await expect(app`DELETE FROM audit_logs`).rejects.toThrow(/permission denied/);
  });
});

describe('integrity constraints', () => {
  it('audit_logs rejects update and delete even for the owner role', async () => {
    await sql`INSERT INTO audit_logs (action, entity_type) VALUES ('test.event', 'test')`;
    await expect(sql`UPDATE audit_logs SET action = 'x'`).rejects.toThrow(/append-only/);
    await expect(sql`DELETE FROM audit_logs`).rejects.toThrow(/append-only/);
  });

  it('a release with tracks cannot be deleted out from under them', async () => {
    const { releaseId } = await seedRelease();
    await sql`INSERT INTO tracks (release_id, position, title) VALUES (${releaseId}, 1, 'DEV FIXTURE Track')`;
    await expect(sql`DELETE FROM releases WHERE id = ${releaseId}`).rejects.toThrow(/foreign key/);
  });

  it('track positions are unique per release and disc', async () => {
    const { releaseId } = await seedRelease();
    await sql`INSERT INTO tracks (release_id, position, title) VALUES (${releaseId}, 1, 'A')`;
    await expect(sql`INSERT INTO tracks (release_id, position, title) VALUES (${releaseId}, 1, 'B')`).rejects.toThrow(/tracks_release_disc_position_key/);
  });

  it('a track cannot be playable without a playback asset', async () => {
    const { releaseId } = await seedRelease();
    await expect(
      sql`INSERT INTO tracks (release_id, position, title, playback_mode) VALUES (${releaseId}, 1, 'A', 'full')`,
    ).rejects.toThrow(/tracks_playable_has_asset/);
  });

  it('a master recording can never be marked public', async () => {
    await expect(sql`
      INSERT INTO media_assets (kind, visibility, storage_provider, bucket, object_key, mime_type, byte_size)
      VALUES ('audio_master', 'public', 'supabase', 'media-private', 'k1', 'audio/wav', 10)`).rejects.toThrow(/media_assets_master_private/);
  });

  it('platform links must be https and belong to exactly one owner', async () => {
    const { releaseId, artistId } = await seedRelease();
    await expect(sql`INSERT INTO platform_links (release_id, platform, url) VALUES (${releaseId}, 'shopify', 'http://shop.test/p')`).rejects.toThrow(/platform_links_https/);
    await expect(sql`INSERT INTO platform_links (release_id, artist_id, platform, url) VALUES (${releaseId}, ${artistId}, 'shopify', 'https://shop.test/p')`).rejects.toThrow(/platform_links_single_owner/);
    await expect(sql`INSERT INTO platform_links (platform, url) VALUES ('shopify', 'https://shop.test/p')`).rejects.toThrow(/platform_links_single_owner/);
  });

  it('a published release must record when it was published', async () => {
    const { releaseId } = await seedRelease();
    await expect(sql`UPDATE releases SET status = 'published' WHERE id = ${releaseId}`).rejects.toThrow(/releases_published_has_timestamp/);
  });

  it('slugs are URL-safe', async () => {
    await expect(sql`INSERT INTO artists (slug, name) VALUES ('Bad Slug', 'x')`).rejects.toThrow(/artists_slug_shape/);
  });
});
