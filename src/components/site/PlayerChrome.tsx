/*
 * Mini player + full-screen listening room. Rendered by the site layout so it
 * survives route changes; Phase 3 replaces the placeholder copy with a single
 * persistent HTMLAudioElement. Until licensed audio exists, playback is
 * deliberately disabled rather than faked.
 */
export function PlayerChrome() {
  return (
    <>
      <div className="mini-player" id="miniPlayer">
        <div className="mini-art" aria-hidden="true"><span>L<b>&amp;</b>A</span></div>
        <div className="mini-info">
          <strong>Featured EP</strong>
          <span>Audio pending · Preview interface</span>
        </div>
        <span className="mini-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <button id="expandPlayer" className="mini-expand" aria-label="Expand music player">↗</button>
      </div>

      <div className="player-overlay" id="playerOverlay" role="dialog" aria-modal="true" aria-labelledby="overlayTitle" aria-hidden="true">
        <div className="nebula nebula-overlay" aria-hidden="true"><i></i><i></i><i></i></div>
        <div className="overlay-header">
          <span>LEO &amp; ASSOCIATES / LISTENING ROOM</span>
          <button id="closePlayer" aria-label="Close music player">✕</button>
        </div>
        <div className="overlay-center">
          <div className="overlay-stage" aria-hidden="true">
            <div className="disc overlay-disc spin"><div className="disc-label"><span>L<b>&amp;</b>A</span><small>001</small></div></div>
            <div className="overlay-art"><span>L<b>&amp;</b>A</span></div>
          </div>
          <p className="overlay-kicker">FEATURED EP / RELEASE 001</p>
          <h2 id="overlayTitle">THE MUSIC<br /><em>IS COMING.</em></h2>
          <p className="overlay-explainer">The player is ready for the label&apos;s authorized audio files. No music has been uploaded yet.</p>
          <button className="overlay-disabled" disabled>▶ AUDIO NOT YET AVAILABLE</button>
        </div>
        <div className="overlay-bottom">LEO &amp; ASSOCIATES <span>INDEPENDENT MUSIC LABEL</span></div>
      </div>
    </>
  );
}
