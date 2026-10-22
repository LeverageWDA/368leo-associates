import type { Metadata } from 'next';
import { CatalogueIndex } from '@/components/music/CatalogueIndex';
import { getReleases } from '@/server/content/repository';

export const metadata: Metadata = {
  title: 'Music',
  description: 'The Leo & Associates catalogue: singles, EPs and albums.',
  alternates: { canonical: '/music' },
};

export default async function MusicPage() {
  const releases = await getReleases();
  return (
    <main id="main" className="pg pg-music">
      <header className="music-head">
        <p className="pg-kicker">The catalogue</p>
        <h1 className="music-word" aria-label="Music">
          <span aria-hidden="true">MUS</span>
          <em aria-hidden="true">ic</em>
        </h1>
        <p className="music-count">
          {releases.length === 0 ? 'No releases published yet' : `${releases.length} ${releases.length === 1 ? 'release' : 'releases'}`}
        </p>
      </header>
      {releases.length === 0 ? (
        <section className="pg-empty">
          <p className="pg-empty-line">The catalogue opens with the first release.</p>
          <p className="pg-empty-note">Releases appear here as soon as the label publishes them, with artwork, tracklists and where to listen.</p>
        </section>
      ) : (
        <CatalogueIndex releases={releases} />
      )}
    </main>
  );
}
