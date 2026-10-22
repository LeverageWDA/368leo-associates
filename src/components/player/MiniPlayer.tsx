'use client';

import { useEffect } from 'react';
import { usePlayerContext, usePlayerState } from './PlayerProvider';

/**
 * Compact player pinned to the bottom of the screen once a track is loaded.
 * The page gets matching bottom padding (body.mini-on) so it never covers content.
 */
export function MiniPlayer() {
  const { engine, openOverlay, overlayOpen } = usePlayerContext();
  const state = usePlayerState();
  const track = state.queue[state.index];
  const visible = !!track;
  const playing = state.status === 'playing' || state.status === 'loading';
  const progress = state.duration ? (state.currentTime / state.duration) * 100 : 0;

  useEffect(() => {
    document.body.classList.toggle('mini-on', visible);
    return () => document.body.classList.remove('mini-on');
  }, [visible]);

  return (
    <div className={`mini-player${visible && !overlayOpen ? ' visible' : ''}`} aria-hidden={!visible} inert={!visible || overlayOpen}>
      <div className="mini-art" aria-hidden="true">
        <span>L<b>&amp;</b>A</span>
      </div>
      <div className="mini-info">
        <strong>{track?.title ?? ''}</strong>
        <span>
          {track ? `${track.artistName} · ${track.playbackMode === 'preview' ? 'Preview' : track.releaseTitle}` : ''}
          {state.status === 'error' ? ' · Unavailable' : ''}
        </span>
      </div>
      <button
        type="button"
        className="mini-toggle"
        onClick={() => engine?.toggle()}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z" /></svg>
        )}
      </button>
      <button type="button" className="mini-expand" onClick={openOverlay} aria-label="Open full player">↗</button>
      <span className="mini-progress" aria-hidden="true" style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}
