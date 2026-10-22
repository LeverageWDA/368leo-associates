'use client';

import { playableTracks, type Release } from '@/lib/catalog';
import { usePlayerContext, usePlayerState } from '@/components/player/PlayerProvider';

/** Plays a release from the top (or toggles it if it is already playing). */
export function PlayReleaseButton({ release, className = 'btn btn-black' }: { release: Release; className?: string }) {
  const { engine } = usePlayerContext();
  const state = usePlayerState();
  const queue = playableTracks(release);
  if (queue.length === 0) return null;
  const current = state.queue[state.index];
  const owns = !!current && queue.some(q => q.id === current.id);
  const playing = owns && (state.status === 'playing' || state.status === 'loading');
  return (
    <button type="button" className={className} onClick={() => (owns ? engine?.toggle() : engine?.playQueue(queue, 0))}>
      <b>{playing ? 'PAUSE' : owns ? 'RESUME' : 'PLAY THE RELEASE'}</b> <span aria-hidden="true">{playing ? '❚❚' : '▶'}</span>
    </button>
  );
}

/** Opens the full-screen listening room. */
export function OpenPlayerButton({ className = 'open-player' }: { className?: string }) {
  const { openOverlay } = usePlayerContext();
  return (
    <button type="button" id="openPlayer" className={className} onClick={openOverlay}>
      <b>OPEN THE PLAYER</b> <span aria-hidden="true">↗</span>
    </button>
  );
}
