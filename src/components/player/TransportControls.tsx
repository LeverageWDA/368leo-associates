'use client';

import { formatDuration, type PlayableTrack } from '@/lib/catalog';
import { usePlayerContext, usePlayerState } from './PlayerProvider';

/**
 * Previous / play-pause / next and an accessible seek slider for the shared
 * engine. `tracks` is what Play starts when nothing is loaded yet.
 */
export function TransportControls({
  tone = 'dark',
  showSeek = true,
  tracks = [],
}: {
  tone?: 'dark' | 'light';
  showSeek?: boolean;
  tracks?: PlayableTrack[];
}) {
  const { engine } = usePlayerContext();
  const state = usePlayerState();
  const track = state.queue[state.index];
  const playing = state.status === 'playing' || state.status === 'loading';
  const disabled = !engine || !track;
  const canStart = !!engine && (!!track || tracks.length > 0);
  const onPlay = () => {
    if (!engine) return;
    if (track) engine.toggle();
    else engine.playQueue(tracks, 0);
  };

  return (
    <div className={`transport transport-${tone}`}>
      <div className="transport-buttons">
        <button type="button" className="transport-btn" onClick={() => engine?.previous()} disabled={disabled} aria-label="Previous track">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
        </button>
        <button
          type="button"
          className="transport-btn transport-play"
          onClick={onPlay}
          disabled={!canStart}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z" /></svg>
          )}
        </button>
        <button
          type="button"
          className="transport-btn"
          onClick={() => engine?.next()}
          disabled={disabled || state.index >= state.queue.length - 1}
          aria-label="Next track"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z" /></svg>
        </button>
      </div>
      {showSeek && (
        <div className="transport-seek">
          <span className="transport-time">{formatDuration(state.currentTime * 1000)}</span>
          <input
            type="range"
            min={0}
            max={state.duration || 0}
            step={0.1}
            value={Math.min(state.currentTime, state.duration || 0)}
            onChange={e => engine?.seek(Number(e.target.value))}
            disabled={disabled || !state.duration}
            aria-label="Seek"
            aria-valuetext={`${formatDuration(state.currentTime * 1000)} of ${formatDuration(state.duration * 1000)}`}
            style={{ '--fill': `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%` } as React.CSSProperties}
          />
          <span className="transport-time">{formatDuration(state.duration * 1000)}</span>
        </div>
      )}
    </div>
  );
}
