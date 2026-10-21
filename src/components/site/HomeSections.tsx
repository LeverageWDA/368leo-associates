/*
 * Homepage sections, ported 1:1 from the approved static prototype
 * (prototype/index.html). Copy here is the approved concept copy; every slot
 * that needs client-supplied information is labelled as pending rather than
 * filled with invented content. Phase 4 feeds these from site_content and
 * published releases.
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

export function FeaturedRelease() {
  return (
    <section className="release section-pad" id="release">
      <div className="section-heading" data-reveal>
        <div className="section-id"><span className="small-cross">✳</span> 01 / FEATURED RELEASE</div>
        <p>ONE RELEASE.<br />AN ENTIRE WORLD TO EXPLORE.</p>
      </div>
      <div className="release-layout">
        <div className="release-art-wrap" data-reveal>
          <div className="release-stage">
            <div className="disc release-disc" aria-hidden="true">
              <div className="disc-label"><span>L<b>&amp;</b>A</span><small>SIDE A</small></div>
            </div>
            <div className="release-art" role="img" aria-label="Placeholder for official EP cover artwork">
              <div className="art-grid" aria-hidden="true"></div>
              <div className="art-top"><span>LEO &amp; ASSOCIATES</span><span>RELEASE 001</span></div>
              <div className="art-monogram">L<span>&amp;</span>A</div>
              <div className="art-sheen"></div>
              <div className="art-bottom"><span>THE FEATURED<br />RELEASE</span><span>OFFICIAL ARTWORK<br />COMING SOON</span></div>
            </div>
          </div>
          <span className="art-caption">[ ARTWORK PLACEHOLDER — REPLACE WITH THE OFFICIAL EP COVER ]</span>
        </div>
        <div className="release-content" data-reveal>
          <span className="eyebrow">THE FIRST CHAPTER / 001</span>
          <h2 className="split"><span className="line"><span>THE</span></span><span className="line"><em>RELEASE<span className="period">.</span></em></span></h2>
          <p className="release-desc">One project at the center of it all. Explore the music, discover the tracks, and find where to listen or purchase.</p>
          <div className="release-meta">
            <div><span>FORMAT</span><strong>EXTENDED PLAY / EP</strong></div>
            <div><span>ARTIST</span><strong>TO BE CONFIRMED</strong></div>
            <div><span>AVAILABILITY</span><strong>APPLE MUSIC · SHOPIFY</strong></div>
          </div>
          <div className="release-actions">
            <a href="#experience" className="btn btn-black"><b>EXPLORE THE MUSIC</b> <span>↗</span></a>
            <a href="#platforms" className="btn btn-outline"><b>WHERE TO LISTEN</b> <span>↗</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ListeningRoom() {
  return (
    <section className="experience" id="experience">
      <div className="nebula" aria-hidden="true"><i></i><i></i><i></i></div>
      <div className="experience-top"><span>02 / LISTENING ROOM</span><span>TURN THE VOLUME UP ↗</span></div>
      <div className="experience-title">
        <h2 className="split">
          <span className="line"><span>DON&apos;T JUST</span></span>
          <span className="line"><span>SEE IT.</span></span>
          <span className="line line-feel"><em>FEEL IT.</em></span>
        </h2>
        <p data-reveal>A space for the music.<br />Nothing in the way.</p>
      </div>
      <div className="player-layout">
        <div className="player-cover" role="img" aria-label="Placeholder album artwork">
          <div className="orbit orbit-1" aria-hidden="true"></div>
          <div className="orbit orbit-2" aria-hidden="true"></div>
          <div className="orbit orbit-3" aria-hidden="true"><b></b></div>
          <div className="player-cover-circle"><div className="player-cover-inner">L<span>&amp;</span>A</div></div>
          <span className="player-cover-label">FEATURED EP / 001</span>
          <span className="player-cover-status"><i></i>AUDIO PENDING</span>
        </div>
        <div className="track-panel" data-reveal>
          <div className="track-panel-top"><span>THE TRACKLIST</span><span>PREVIEW MODE</span></div>
          <div className="track-placeholder"><span className="track-index">01—</span><div><strong>Track details coming soon</strong><p>The official EP tracklist hasn&apos;t been supplied yet.</p></div><span className="track-symbol">↗</span></div>
          <div className="track-placeholder"><span className="track-index">02—</span><div><strong>Listen on the official platforms</strong><p>Audio playback will activate when licensed files are added.</p></div><span className="track-symbol">↗</span></div>
          <div className="track-foot">
            <span>YOUR NEXT FAVORITE SOUND <em>starts here.</em></span>
            <button className="open-player" id="openPlayer"><b>EXPLORE PLAYER</b> <span>↗</span></button>
          </div>
        </div>
      </div>
      <div className="experience-bottom"><span>INDEPENDENT MUSIC. DISTINCTIVE VISION.</span><span>LEO &amp; ASSOCIATES / 2026</span></div>
    </section>
  );
}

export function Platforms() {
  return (
    <section className="platforms section-pad" id="platforms">
      <div className="section-heading" data-reveal>
        <div className="section-id"><span className="small-cross">✳</span> 03 / FIND THE MUSIC</div>
        <p>THE MUSIC GOES<br />WHERE YOU GO.</p>
      </div>
      <h2 className="split"><span className="line"><span>YOUR MUSIC.</span></span><span className="line"><em>YOUR WAY.</em></span></h2>
      <div className="platform-grid">
        <div className="platform" data-reveal><span className="platform-num">01</span><div><strong>APPLE MUSIC</strong><p>STREAM THE RELEASE</p></div><span className="platform-tag">LINK PENDING</span><span className="platform-arrow">↗</span></div>
        <div className="platform" data-reveal><span className="platform-num">02</span><div><strong>SHOPIFY</strong><p>PURCHASE THE RELEASE</p></div><span className="platform-tag">LINK PENDING</span><span className="platform-arrow">↗</span></div>
      </div>
      <p className="link-notice">Official destination URLs will be connected when provided. No purchase links are fabricated.</p>
    </section>
  );
}

export function About() {
  return (
    <section className="about section-pad" id="about">
      <div className="about-top"><span>04 / THE LABEL</span><span>MORE THAN A NAME.</span></div>
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
          <p>Leo &amp; Associates is an independent music label. This space will tell the label&apos;s story in its own words once the founder&apos;s approved introduction is available.</p>
          {/* No contact address has been supplied, so this is text, not a link. */}
          <span className="about-link" aria-disabled="true">CONTACT DETAILS TO FOLLOW ↗</span>
        </div>
      </div>
    </section>
  );
}

export function Connect() {
  return (
    <section className="connect" id="connect">
      <div className="connect-top"><span>THE NEXT CHAPTER STARTS HERE</span><span>05 / CONNECT</span></div>
      <h2 className="split"><span className="line"><span>STAY IN</span></span><span className="line line-loop"><em>THE LOOP<span>.</span></em></span></h2>
      <div className="connect-bottom">
        <p>New music. New chapters.<br />Stay close to the sound.</p>
        <div className="connect-links"><span>SOCIAL LINKS — COMING SOON</span><span>CONTACT EMAIL — TO BE CONFIRMED</span></div>
      </div>
    </section>
  );
}
