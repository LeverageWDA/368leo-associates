import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ListenLinks, PurchaseOptions } from '@/components/music/ListenLinks';
import { PlayReleaseButton } from '@/components/music/PlayReleaseButton';
import { ReleaseSleeve } from '@/components/music/ReleaseSleeve';
import { TrackList } from '@/components/music/TrackList';
import { Turntable } from '@/components/turntable/Turntable';
import { RELEASE_TYPE_LABEL, playableTracks, type Release } from '@/lib/catalog';
import { publicSiteUrl } from '@/lib/site-url';
import { getRelease, getReleases } from '@/server/content/repository';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getReleases()).map(r => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const release = await getRelease((await params).slug);
  if (!release) return {};
  const title = `${release.title} — ${release.artist.name}`;
  const description = release.description ?? `${RELEASE_TYPE_LABEL[release.type]} by ${release.artist.name} on Leo & Associates.`;
  return {
    title,
    description,
    alternates: { canonical: `/music/${release.slug}` },
    openGraph: { title, description, type: 'music.album', images: release.coverUrl ? [release.coverUrl] : undefined },
    // Fixture pages must never be indexed.
    robots: release.isFixture ? { index: false, follow: false } : undefined,
  };
}

/** schema.org MusicAlbum built only from supplied fields. */
function structuredData(release: Release) {
  const url = `${publicSiteUrl()}/music/${release.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: release.title,
    url,
    albumReleaseType: { single: 'SingleRelease', ep: 'EPRelease', album: 'AlbumRelease' }[release.type],
    byArtist: { '@type': 'MusicGroup', name: release.artist.name, url: `${publicSiteUrl()}/artists/${release.artist.slug}` },
    numTracks: release.tracks.length,
    ...(release.releaseDate ? { datePublished: release.releaseDate } : {}),
    ...(release.coverUrl ? { image: release.coverUrl } : {}),
    ...(release.catalogueNumber ? { catalogNumber: release.catalogueNumber } : {}),
    track: release.tracks.map(t => ({
      '@type': 'MusicRecording',
      name: t.title,
      position: t.position,
      ...(t.durationMs ? { duration: `PT${Math.floor(t.durationMs / 60000)}M${Math.round((t.durationMs % 60000) / 1000)}S` } : {}),
    })),
  };
}

export default async function ReleasePage({ params }: Props) {
  const release = await getRelease((await params).slug);
  if (!release) notFound();
  const playable = playableTracks(release);
  const details: [string, string][] = [
    ['Format', RELEASE_TYPE_LABEL[release.type]],
    ['Artist', release.artist.name],
    ['Tracks', String(release.tracks.length)],
    ...(release.releaseDate ? ([['Released', release.releaseDate]] as [string, string][]) : []),
    ...(release.catalogueNumber ? ([['Catalogue no.', release.catalogueNumber]] as [string, string][]) : []),
  ];

  return (
    <main id="main" className="pg pg-release">
      {!release.isFixture && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(release)).replace(/</g, '\\u003c') }}
        />
      )}
      <nav className="rel-crumbs" aria-label="Breadcrumb">
        <Link href="/music">Music</Link> <span aria-hidden="true">/</span> <span aria-current="page">{release.title}</span>
      </nav>

      <div className="rel-grid">
        <div className="rel-stage">
          <div className="rel-deck">
            <Turntable tracks={playable} labelImage={release.coverUrl} labelNote={release.catalogueNumber ?? RELEASE_TYPE_LABEL[release.type].toUpperCase()} />
          </div>
          <div className="rel-sleeve">
            <ReleaseSleeve release={release} size="md" />
          </div>
          {playable.length === 0 && (
            <p className="rel-noaudio">No audio is available to play on this site yet. {release.links.some(l => l.platform !== 'shopify') ? 'Use the listening links instead.' : ''}</p>
          )}
        </div>

        <div className="rel-info">
          <p className="pg-kicker pg-kicker-dark">
            {RELEASE_TYPE_LABEL[release.type]}
            {release.releaseDate ? ` · ${release.releaseDate.slice(0, 4)}` : ''}
          </p>
          <h1 className="rel-title">{release.title}</h1>
          <p className="rel-artist">
            <Link href={`/artists/${release.artist.slug}`}>{release.artist.name}</Link>
          </p>
          {release.description && <p className="rel-desc">{release.description}</p>}
          <div className="rel-actions">
            <PlayReleaseButton release={release} className="btn btn-gold" />
          </div>

          <section className="rel-block" aria-labelledby="tracklist">
            <h2 id="tracklist" className="rel-h">Tracklist</h2>
            <TrackList release={release} />
          </section>

          <div className="rel-split">
            <section className="rel-block" aria-labelledby="listen">
              <h2 id="listen" className="rel-h">Listen</h2>
              <ListenLinks links={release.links} />
            </section>
            <section className="rel-block" aria-labelledby="buy">
              <h2 id="buy" className="rel-h">Buy</h2>
              <PurchaseOptions links={release.links} />
            </section>
          </div>

          <section className="rel-block" aria-labelledby="details">
            <h2 id="details" className="rel-h">Details</h2>
            <dl className="rel-dl">
              {details.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </section>

          <section className="rel-block" aria-labelledby="credits">
            <h2 id="credits" className="rel-h">Credits</h2>
            {release.credits.length ? (
              <dl className="rel-dl">
                {release.credits.map(c => (
                  <div key={`${c.role}-${c.name}`}><dt>{c.role}</dt><dd>{c.name}</dd></div>
                ))}
              </dl>
            ) : (
              <p className="muted-note">Credits will be listed once confirmed by the label.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
