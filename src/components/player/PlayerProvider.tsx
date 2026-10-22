'use client';

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from 'react';
import { AudioEngine, IDLE_STATE, type PlayerState } from './engine';

interface PlayerContextValue {
  engine: AudioEngine | null;
  overlayOpen: boolean;
  openOverlay: () => void;
  closeOverlay: () => void;
}

const PlayerContext = createContext<PlayerContextValue>({
  engine: null,
  overlayOpen: false,
  openOverlay: () => {},
  closeOverlay: () => {},
});

const noopSubscribe = () => () => {};
const idle = () => IDLE_STATE;

// One engine per page lifetime, created on first client render. It is never
// disposed: the public layout is never unmounted during a visit, and a single
// instance survives React strict-mode remounts in development.
let sharedEngine: AudioEngine | null = null;
const getEngine = () => (sharedEngine ??= new AudioEngine());
const noEngine = () => null;

/**
 * Owns the single AudioEngine for the public site. Mounted by the site layout,
 * so the same audio element keeps playing across page navigations.
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const engine = useSyncExternalStore(noopSubscribe, getEngine, noEngine);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const openOverlay = useCallback(() => setOverlayOpen(true), []);
  const closeOverlay = useCallback(() => setOverlayOpen(false), []);
  const value = useMemo(() => ({ engine, overlayOpen, openOverlay, closeOverlay }), [engine, overlayOpen, openOverlay, closeOverlay]);

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <PlayerAnnouncer />
    </PlayerContext.Provider>
  );
}

export function usePlayerContext(): PlayerContextValue {
  return useContext(PlayerContext);
}

/** Current player state; re-renders on change. Idle until the engine mounts. */
export function usePlayerState(): PlayerState {
  const { engine } = useContext(PlayerContext);
  return useSyncExternalStore(engine?.subscribe ?? noopSubscribe, engine?.getSnapshot ?? idle, idle);
}

/** Screen-reader announcements for track and playback changes. */
function PlayerAnnouncer() {
  const state = usePlayerState();
  const track = state.queue[state.index];
  let message = '';
  if (state.error) message = state.error;
  else if (track && state.status === 'playing') message = `Playing ${track.title} by ${track.artistName}`;
  else if (track && state.status === 'paused' && !state.scratching) message = `Paused ${track.title}`;
  return (
    <div className="sr-only" role="status" aria-live="polite">
      {message}
    </div>
  );
}
