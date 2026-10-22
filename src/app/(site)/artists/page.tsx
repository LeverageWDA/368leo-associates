import type { Metadata } from 'next';
import Link from 'next/link';
import { getArtists, getReleases } from '@/server/content/repository';

export const metadata: Metadata = {
  title: 'Artists',
  description: 'The artists of Leo & Associates.',
  alternates: { canonical: '/artists' },
};

export default async function ArtistsPage() {
  const [artists, releases] = await Promise.all([getArtists(), getReleases()]);
  return (
    <main id="main" className="pg pg-artists">
      <header className="roster-head">
        <p className="pg-kicker pg-kicker-dark">The roster</p>
        <h1 className="roster-word">ARTISTS<span aria-hidden="true">.</span></h1>
      </header>
      {artists.length === 0 ? (
        <section className="pg-empty pg-empty-dark">
          <p className="pg-empty-line">The roster is introduced with the first release.</p>
          <p className="pg-empty-note">Each artist will have a profile here with their music, story and channels.</p>
        </section>
      ) : (
        <ol className="roster-list">
          {artists.map((a, i) => {
            const count = releases.filter(r => r.artist.slug === a.slug).length;
            return (
              <li key={a.slug}>
                <Link href={`/artists/${a.slug}`} className="roster-row">
                  <span className="roster-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <span className="roster-name">{a.name}</span>
                  <span className="roster-meta">{count} {count === 1 ? 'release' : 'releases'}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
