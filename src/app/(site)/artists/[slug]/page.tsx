import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReleaseSleeve } from '@/components/music/ReleaseSleeve';
import { Pending } from '@/components/site/PageMarkers';
import { SocialLinks } from '@/components/site/SocialLinks';
import { RELEASE_TYPE_LABEL } from '@/lib/catalog';
import { getArtist, getArtists, getReleasesByArtist } from '@/server/content/repository';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getArtists()).map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = await getArtist((await params).slug);
  if (!artist) return {};
  return {
    title: artist.name,
    description: artist.bio?.slice(0, 160) ?? `${artist.name} on Leo & Associates.`,
    alternates: { canonical: `/artists/${artist.slug}` },
    openGraph: { title: artist.name, type: 'profile', images: artist.portraitUrl ? [artist.portraitUrl] : undefined },
    robots: artist.isFixture ? { index: false, follow: false } : undefined,
  };
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const artist = await getArtist(slug);
  if (!artist) notFound();
  const releases = await getReleasesByArtist(slug);

  return (
    <main id="main" className="pg pg-artist">
      <nav className="rel-crumbs rel-crumbs-light" aria-label="Breadcrumb">
        <Link href="/artists">Artists</Link> <span aria-hidden="true">/</span> <span aria-current="page">{artist.name}</span>
      </nav>
      <header className="artist-head">
        <h1 className="artist-name">{artist.name}</h1>
        <div className="artist-portrait">
          {artist.portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- portrait URLs come from managed storage
            <img src={artist.portraitUrl} alt={`Portrait of ${artist.name}`} />
          ) : (
            <div className="artist-portrait-empty" role="img" aria-label={`Portrait of ${artist.name} not yet supplied`}>
              <span aria-hidden="true">L<b>&amp;</b>A</span>
              <small>Portrait pending</small>
            </div>
          )}
        </div>
      </header>

      <div className="artist-body">
        <section className="artist-bio" aria-labelledby="bio">
          <h2 id="bio" className="pg-label">Biography</h2>
          {artist.bio ? <p>{artist.bio}</p> : <Pending>The artist&apos;s biography, in their own words.</Pending>}
        </section>
        <section className="artist-channels" aria-labelledby="channels">
          <h2 id="channels" className="pg-label">Channels</h2>
          <SocialLinks links={artist.socials} className="artist-social" showHandles empty={<p className="muted-note muted-light">Verified channels will be listed here.</p>} />
        </section>
      </div>

      <section className="artist-releases" aria-labelledby="discography">
        <h2 id="discography" className="pg-label">Discography</h2>
        {releases.length === 0 ? (
          <p className="muted-note muted-light">No published releases yet.</p>
        ) : (
          <ul className="sleeve-grid">
            {releases.map(r => (
              <li key={r.slug}>
                <Link href={`/music/${r.slug}`} className="sleeve-card">
                  <ReleaseSleeve release={r} size="md" />
                  <span className="sleeve-card-title">{r.title}</span>
                  <span className="sleeve-card-meta">{RELEASE_TYPE_LABEL[r.type]}{r.releaseDate ? ` · ${r.releaseDate.slice(0, 4)}` : ''}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
