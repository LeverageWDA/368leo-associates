import Link from 'next/link';
import { PLATFORM_LABEL, RELEASE_TYPE_LABEL, isSafeExternalUrl, playableTracks, type Release, type SocialLink } from '@/lib/catalog';
import { OpenPlayerButton, PlayReleaseButton } from '@/components/music/PlayReleaseButton';
import { ReleaseSleeve } from '@/components/music/ReleaseSleeve';
import { TrackList } from '@/components/music/TrackList';
import { Turntable } from '@/components/turntable/Turntable';
import { SocialLinks } from './SocialLinks';

/*
 * Homepage sections. Hero and marquee are the approved prototype markup. The
 * other sections render the featured *published* release when one exists and
 * a labelled empty state when it does not — never invented content.
 */

export function Hero() {
  return (
    <section className="hero" aria-labelledby="heroTitle">
      <div className="hero-topline"><span>INDEPENDENT BY NATURE.</span><span>MADE TO BE HEARD. ↘</span></div>
      <div className="hero-grid">
        <p className="eyebrow" data-reveal><span className="status-dot"></span> THE MUSIC STARTS HERE <span className="serial">/ 001</span></p>
        <h1 id="heroTitle" className="split">
          <span className="line"><span>SOUND</span></span>
          <span className="line hero-line-two"><span>WITHOUT</span></span>
          <span className="line"><em>LIMITS<span className="period">.</span></em></span>
        </h1>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-art-inner" data-parallax="0.12">
            <div className="disc spin">
              <div className="disc-label"><span>L<b>&amp;</b>A</span><small>001</small></div>
            </div>
          </div>
          <span className="hero-art-tag"><i></i>RELEASE 001 — COVER ART PENDING</span>
        </div>
        <div className="hero-side" data-reveal>
          <p>A label. A vision.<br />And music worth<br />turning up for.</p>
          <a href="#release" className="circle-arrow magnetic" aria-label="Explore the release"><span>↘</span></a>
        </div>
      </div>
      <div className="hero-bottom"><span>LEO &amp; ASSOCIATES © 2026</span><span>SCROLL TO DISCOVER <span className="down-arrow">↓</span></span></div>
    </section>
  );
}

export function Marquee() {
  return (
    <section className="marquee" aria-label="Music label identity">
      <div className="marquee-track">
        <span>MUSIC IS THE MESSAGE</span><i>✳</i><em>the sound is the story</em><i>✳</i>
        <span>MUSIC IS THE MESSAGE</span><i>✳</i><em>the sound is the story</em><i>✳</i>
        <span aria-hidden="true">MUSIC IS THE MESSAGE</span><i>✳</i><em aria-hidden="true">the sound is the story</em><i>✳</i>
        <span aria-hidden="true">MUSIC IS THE MESSAGE</span><i>✳</i><em aria-hidden="true">the sound is the story</em><i>✳</i>
      </div>
    </section>
  );
}

export function FeaturedRelease({ release }: { release: Release | null }) {
  return (
    <section className="release section-pad" id="release">
      <div className="section-heading" data-reveal>
        <div className="section-id"><span className="small-cross" aria-hidden="true">✳</span> FEATURED RELEASE</div>
        <p>ONE RELEASE.<br />AN ENTIRE WORLD TO EXPLORE.</p>
      </div>
      <div className="release-layout">
        <div className="release-art-wrap" data-reveal>
          <div className="release-stage">
            <div className="disc release-disc" aria-hidden="true">
              <div className="disc-label"><span>L<b>&amp;</b>A</span><small>SIDE A</small></div>
            </div>
            {release?.coverUrl ? (
              <div className="release-art release-art-cover"><ReleaseSleeve release={release} size="lg" /></div>
            ) : (
              <div className="release-art" role="img" aria-label="Placeholder for the official cover artwork">
                <div className="art-grid" aria-hidden="true"></div>
                <div className="art-top"><span>LEO &amp; ASSOCIATES</span><span>{release ? RELEASE_TYPE_LABEL[release.type].toUpperCase() : 'RELEASE'}</span></div>
                <div className="art-monogram">L<span>&amp;</span>A</div>
                <div className="art-sheen"></div>
                <div className="art-bottom"><span>THE FEATURED<br />RELEASE</span><span>OFFICIAL ARTWORK<br />COMING SOON</span></div>
              </div>
            )}
          </div>
          {!release?.coverUrl && <span className="art-caption">Artwork placeholder — the official cover will replace it.</span>}
        </div>
        <div className="release-content" data-reveal>
          <span className="eyebrow">{release ? `${RELEASE_TYPE_LABEL[release.type].toUpperCase()}${release.releaseDate ? ` / ${release.releaseDate.slice(0, 4)}` : ''}` : 'THE FIRST CHAPTER'}</span>
          {release ? (
            <h2 className="release-title-live">{release.title}</h2>
          ) : (
            <h2 className="split"><span className="line"><span>THE</span></span><span className="line"><em>RELEASE<span className="period">.</span></em></span></h2>
          )}
          <p className="release-desc">
            {release?.description ?? 'One project at the center of it all. Explore the music, discover the tracks, and find where to listen or purchase.'}
          </p>
          <dl className="release-meta">
            <div><dt>FORMAT</dt><dd>{release ? RELEASE_TYPE_LABEL[release.type].toUpperCase() : 'EXTENDED PLAY / EP'}</dd></div>
            <div><dt>ARTIST</dt><dd>{release ? <Link href={`/artists/${release.artist.slug}`}>{release.artist.name.toUpperCase()}</Link> : 'TO BE CONFIRMED'}</dd></div>
            <div><dt>AVAILABILITY</dt><dd>{release && release.links.length ? release.links.map(l => PLATFORM_LABEL[l.platform]).join(' · ').toUpperCase() : 'LINKS PENDING'}</dd></div>
          </dl>
          <div className="release-actions">
            {release ? (
              <>
                <Link href={`/music/${release.slug}`} className="btn btn-black"><b>OPEN THE RELEASE</b> <span aria-hidden="true">↗</span></Link>
                <PlayReleaseButton release={release} className="btn btn-outline" />
              </>
            ) : (
              <>
                <Link href="/music" className="btn btn-black"><b>EXPLORE THE MUSIC</b> <span aria-hidden="true">↗</span></Link>
                <a href="#platforms" className="btn btn-outline"><b>WHERE TO LISTEN</b> <span aria-hidden="true">↓</span></a>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ListeningRoom({ release }: { release: Release | null }) {
  const tracks = release ? playableTracks(release) : [];
  return (
    <section className="experience" id="experience" aria-labelledby="listenTitle">
      <div className="nebula" aria-hidden="true"><i></i><i></i><i></i></div>
      <div className="experience-top"><span>LISTENING ROOM</span><span>TURN THE VOLUME UP</span></div>
      <div className="experience-title">
        <h2 className="split" id="listenTitle">
          <span className="line"><span>DON&apos;T JUST</span></span>
          <span className="line"><span>SEE IT.</span></span>
          <span className="line line-feel"><em>FEEL IT.</em></span>
        </h2>
        <p data-reveal>Put your hand on the record.<br />Drag it to scratch, let go to drop back in.</p>
      </div>
      <div className="player-layout">
        <div className="player-cover player-deck">
          <div className="orbit orbit-1" aria-hidden="true"></div>
          <div className="orbit orbit-2" aria-hidden="true"></div>
          <Turntable tracks={tracks} labelNote={release?.catalogueNumber ?? undefined} labelImage={release?.coverUrl} />
          {tracks.length === 0 && <span className="player-cover-status"><i></i>AUDIO PENDING</span>}
        </div>
        <div className="track-panel" data-reveal>
          <div className="track-panel-top"><span>{release ? release.title.toUpperCase() : 'THE TRACKLIST'}</span><span>{tracks.length ? `${tracks.length} PLAYABLE` : 'NO AUDIO YET'}</span></div>
          {release ? (
            <TrackList release={release} />
          ) : (
            <>
              <div className="track-placeholder"><span className="track-index">01</span><div><strong>Track details coming soon</strong><p>The official tracklist hasn&apos;t been supplied yet.</p></div></div>
              <div className="track-placeholder"><span className="track-index">02</span><div><strong>Playback activates with licensed audio</strong><p>Nothing plays here until the label publishes authorised files.</p></div></div>
            </>
          )}
          <div className="track-foot">
            <span>YOUR NEXT FAVORITE SOUND <em>starts here.</em></span>
            <OpenPlayerButton />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Platforms({ release }: { release: Release | null }) {
  const links = (release?.links ?? []).filter(l => isSafeExternalUrl(l.url));
  const rows: { key: string; name: string; action: string; url: string | null }[] = links.length
    ? links.map(l => ({ key: l.url, name: PLATFORM_LABEL[l.platform], action: l.platform === 'shopify' ? 'PURCHASE THE RELEASE' : 'STREAM THE RELEASE', url: l.url }))
    : [
        { key: 'apple', name: 'APPLE MUSIC', action: 'STREAM THE RELEASE', url: null },
        { key: 'shopify', name: 'SHOPIFY', action: 'PURCHASE THE RELEASE', url: null },
      ];
  return (
    <section className="platforms section-pad" id="platforms">
      <div className="section-heading" data-reveal>
        <div className="section-id"><span className="small-cross" aria-hidden="true">✳</span> FIND THE MUSIC</div>
        <p>THE MUSIC GOES<br />WHERE YOU GO.</p>
      </div>
      <h2 className="split"><span className="line"><span>YOUR MUSIC.</span></span><span className="line"><em>YOUR WAY.</em></span></h2>
      <ul className="platform-grid">
        {rows.map((r, i) => (
          <li key={r.key} data-reveal>
            {r.url ? (
              <a className="platform" href={r.url} target="_blank" rel="noopener noreferrer">
                <span className="platform-num">{String(i + 1).padStart(2, '0')}</span>
                <div><strong>{r.name.toUpperCase()}</strong><p>{r.action}</p></div>
                <span className="platform-tag">OPENS {r.name.toUpperCase()}</span>
                <span className="platform-arrow" aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <div className="platform platform-pending">
                <span className="platform-num">{String(i + 1).padStart(2, '0')}</span>
                <div><strong>{r.name}</strong><p>{r.action}</p></div>
                <span className="platform-tag">LINK PENDING</span>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="link-notice">
        {links.length ? 'Links open the official destination in a new tab. Purchases happen on the store, not on this site.' : 'Official destination links appear once verified. No purchase links are fabricated.'}
      </p>
    </section>
  );
}

export function AboutTeaser() {
  return (
    <section className="about section-pad" id="about">
      <div className="about-top"><span>THE LABEL</span><span>MORE THAN A NAME.</span></div>
      <div className="about-main">
        <h2 className="split"><span className="line"><span>BUILT</span></span><span className="line"><span>AROUND</span></span><span className="line"><em>THE MUSIC.</em></span></h2>
        <div className="about-aside" data-reveal>
          <div className="about-symbol" aria-hidden="true">
            <svg className="seal" viewBox="0 0 200 200">
              <defs><path id="sealPath" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
              <text><textPath href="#sealPath" textLength="486" lengthAdjust="spacing">INDEPENDENT MUSIC LABEL · LEO &amp; ASSOCIATES · EST. SOUND ·</textPath></text>
            </svg>
            <span>L<b>&amp;</b>A</span>
          </div>
          <p>Leo &amp; Associates is an independent music label. The label&apos;s story, in its own words, is on the way.</p>
          <Link href="/about" className="about-link">READ ABOUT THE LABEL <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </section>
  );
}

export function Connect({ socials }: { socials: SocialLink[] }) {
  return (
    <section className="connect" id="connect">
      <div className="connect-top"><span>THE NEXT CHAPTER STARTS HERE</span><span>CONNECT</span></div>
      <h2 className="split"><span className="line"><span>STAY IN</span></span><span className="line line-loop"><em>THE LOOP<span>.</span></em></span></h2>
      <div className="connect-bottom">
        <p>New music. New chapters.<br />Stay close to the sound.</p>
        <div className="connect-links">
          <SocialLinks links={socials} className="connect-social" empty={<span>SOCIAL LINKS — COMING SOON</span>} />
          <Link href="/contact" className="connect-contact">GET IN TOUCH <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </section>
  );
}
