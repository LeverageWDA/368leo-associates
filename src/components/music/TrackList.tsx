'use client';

import { formatDuration, playableTracks, type Release } from '@/lib/catalog';
import { usePlayerContext, usePlayerState } from '@/components/player/PlayerProvider';

/**
 * Tracklist with real play buttons. Tracks without authorised audio show their
 * status instead of a play button that would do nothing.
 */
export function TrackList({ release, tone = 'dark' }: { release: Release; tone?: 'dark' | 'light' }) {
  const { engine } = usePlayerContext();
  const state = usePlayerState();
  const queue = playableTracks(release);
  const current = state.queue[state.index];

  return (
    <ol className={`tracklist tracklist-${tone}`}>
      {release.tracks.map(track => {
        const qIndex = queue.findIndex(q => q.id === track.id);
        const isCurrent = current?.id === track.id;
        const playing = isCurrent && (state.status === 'playing' || state.status === 'loading');
        return (
          <li key={track.id} className={`track${isCurrent ? ' track-current' : ''}`}>
            <span className="track-no" aria-hidden="true">{String(track.position).padStart(2, '0')}</span>
            {qIndex >= 0 ? (
              <button
                type="button"
                className="track-play"
                aria-label={`${playing ? 'Pause' : 'Play'} ${track.title}${track.playbackMode === 'preview' ? ' (preview)' : ''}`}
                aria-pressed={playing}
                onClick={() => (isCurrent ? engine?.toggle() : engine?.playQueue(queue, qIndex))}
              >
                {playing ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z" /></svg>
                )}
              </button>
            ) : (
              <span className="track-play track-play-off" aria-hidden="true">—</span>
            )}
            <span className="track-title">
              {track.title}
              {track.playbackMode === 'preview' && <em className="track-tag">Preview</em>}
              {qIndex < 0 && <em className="track-tag track-tag-muted">Not available to play here</em>}
            </span>
            <span className="track-time">{formatDuration(track.durationMs)}</span>
          </li>
        );
      })}
    </ol>
  );
}
