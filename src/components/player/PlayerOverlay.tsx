'use client';

import { useEffect, useRef } from 'react';
import { Turntable } from '@/components/turntable/Turntable';
import { formatDuration } from '@/lib/catalog';
import { usePlayerContext, usePlayerState } from './PlayerProvider';
import { TransportControls } from './TransportControls';

/**
 * Full-screen listening room. Opened from the mini player or the homepage.
 * Focus moves in on open, is trapped while open, and returns on close (Esc).
 */
export function PlayerOverlay() {
  const { engine, overlayOpen, closeOverlay } = usePlayerContext();
  const state = usePlayerState();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const track = state.queue[state.index];

  useEffect(() => {
    if (!overlayOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add('overlay-open');
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => closeRef.current?.focus()));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeOverlay();
      } else if (e.key === 'Tab' && ref.current) {
        const items = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]')];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('overlay-open');
      previous?.focus();
    };
  }, [overlayOpen, closeOverlay]);

  return (
    <div
      ref={ref}
      className={`player-overlay${overlayOpen ? ' active' : ''}`}
      id="playerOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="overlayTitle"
      aria-hidden={!overlayOpen}
      inert={!overlayOpen}
    >
      <div className="nebula nebula-overlay" aria-hidden="true"><i></i><i></i><i></i></div>
      <div className="overlay-header">
        <span>LEO &amp; ASSOCIATES / LISTENING ROOM</span>
        <button ref={closeRef} id="closePlayer" type="button" onClick={closeOverlay} aria-label="Close music player">✕</button>
      </div>

      {track ? (
        <div className="overlay-center overlay-live">
          <div className="overlay-deck">
            <Turntable tracks={state.queue} size="md" labelNote={track.playbackMode === 'preview' ? 'PREVIEW' : undefined} labelImage={track.artworkUrl} />
          </div>
          <p className="overlay-kicker">{track.releaseTitle.toUpperCase()}</p>
          <h2 id="overlayTitle" className="overlay-track-title">{track.title}</h2>
          <p className="overlay-artist">{track.artistName}</p>
          {state.status === 'error' && <p className="overlay-error">{state.error}</p>}
          <TransportControls tone="dark" />
          {state.volumeSupported && (
            <div className="overlay-volume">
              <button type="button" className="transport-btn" onClick={() => engine?.toggleMute()} aria-label={state.muted ? 'Unmute' : 'Mute'}>
                {state.muted || state.volume === 0 ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM16 9l5 6M21 9l-5 6" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM16 8a5 5 0 0 1 0 8" /></svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={state.muted ? 0 : state.volume}
                onChange={e => engine?.setVolume(Number(e.target.value))}
                aria-label="Volume"
                style={{ '--fill': `${(state.muted ? 0 : state.volume) * 100}%` } as React.CSSProperties}
              />
            </div>
          )}
          {state.queue.length > 1 && (
            <ol className="overlay-queue" aria-label="Up next">
              {state.queue.map((t, i) => (
                <li key={t.id}>
                  <button type="button" aria-current={i === state.index ? 'true' : undefined} onClick={() => engine?.playQueue(state.queue, i)}>
                    <span>{String(i + 1).padStart(2, '0')}</span> {t.title}
                    {t.playbackMode === 'preview' && <em> · preview</em>}
                  </button>
                </li>
              ))}
            </ol>
          )}
          <p className="sr-only">Position {formatDuration(state.currentTime * 1000)}</p>
        </div>
      ) : (
        <div className="overlay-center">
          <div className="overlay-stage" aria-hidden="true">
            <div className="disc overlay-disc spin"><div className="disc-label"><span>L<b>&amp;</b>A</span><small>001</small></div></div>
            <div className="overlay-art"><span>L<b>&amp;</b>A</span></div>
          </div>
          <p className="overlay-kicker">LISTENING ROOM</p>
          <h2 id="overlayTitle">THE MUSIC<br /><em>IS COMING.</em></h2>
          <p className="overlay-explainer">The player is ready for the label&apos;s authorised audio. Nothing has been published for playback yet.</p>
          <button type="button" className="overlay-disabled" disabled>▶ AUDIO NOT YET AVAILABLE</button>
        </div>
      )}
      <div className="overlay-bottom">LEO &amp; ASSOCIATES <span>INDEPENDENT MUSIC LABEL</span></div>
    </div>
  );
}
