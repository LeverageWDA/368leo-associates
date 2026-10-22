'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { PlayableTrack } from '@/lib/catalog';
import { usePlayerContext, usePlayerState } from '@/components/player/PlayerProvider';
import {
  RPM_33_DEG_PER_S,
  SCRATCH_THRESHOLD_DEG,
  TAP_MAX_DEG,
  TAP_MAX_MS,
  VelocityTracker,
  pointerAngle,
  scratchRate,
  stepPlatter,
  unwrapDelta,
} from './physics';

interface Props {
  /** Tracks this deck plays, in order. Empty = no authorised audio yet. */
  tracks: PlayableTrack[];
  /** Small text on the record label, e.g. a catalogue number. */
  labelNote?: string;
  /** Optional image for the centre label (real cover art only). */
  labelImage?: string | null;
  size?: 'lg' | 'md';
  /** Shows which scratch mode is active; used by the prototype page. */
  showDiagnostics?: boolean;
}

interface Drag {
  pointerId: number;
  cx: number;
  cy: number;
  last: number;
  net: number;
  total: number;
  startedAt: number;
  scratching: boolean;
}

/**
 * Interactive record deck bound to the site's shared audio engine.
 *
 * - Spins at 33⅓ rpm only while *its* tracks are playing; eases up on play and
 *   spins down on pause (see physics.ts). No CSS loop.
 * - Grab and drag (mouse, pen or touch) to move the record by hand. Beyond
 *   6° it becomes a scratch: the music ducks and pauses and the recently played
 *   audio is scrubbed at the hand's speed (see player/scratch.ts for limits).
 *   Releasing resumes playback from where the hand left the record.
 * - A quick tap toggles play/pause. Keyboard: Space/Enter toggles, ←/→ skip 5 s.
 * - prefers-reduced-motion: no automatic spinning or coasting; dragging works.
 */
export function Turntable({ tracks, labelNote, labelImage, size = 'lg', showDiagnostics = false }: Props) {
  const { engine } = usePlayerContext();
  const state = usePlayerState();
  const hintId = useId();
  const platterRef = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const velocity = useRef(0);
  const drag = useRef<Drag | null>(null);
  const tracker = useRef(new VelocityTracker());
  const [reduced, setReduced] = useState(false);
  const [scratchMode, setScratchMode] = useState<'none' | 'scrub' | 'effect' | 'visual'>('none');

  const ids = tracks.map(t => t.id).join('|');
  const current = state.queue[state.index];
  const owns = !!current && tracks.some(t => t.id === current.id);
  const playing = owns && (state.status === 'playing' || state.status === 'loading');
  const armOn = owns && (playing || state.scratching);
  const hasAudio = tracks.length > 0;

  // Mirror values the animation loop needs without restarting it.
  const live = useRef({ owns, reduced });
  useEffect(() => {
    live.current = { owns, reduced };
  }, [owns, reduced]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Animation loop: platter physics while idle, scratch rate while held.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const d = drag.current;
      if (d) {
        if (d.scratching) engine?.updateScratch(scratchRate(tracker.current.velocity(now)));
      } else {
        const { owns: o, reduced: r } = live.current;
        const target = !r && o && engine?.isPlaying() ? RPM_33_DEG_PER_S : 0;
        velocity.current = r && !(o && engine?.isPlaying()) ? 0 : stepPlatter(velocity.current, target, dt);
        angle.current = (angle.current + velocity.current * dt) % 360;
      }
      if (platterRef.current) platterRef.current.style.transform = `rotate(${angle.current.toFixed(2)}deg)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  const toggle = () => {
    if (!engine || !hasAudio) return;
    if (owns) engine.toggle();
    else engine.playQueue(tracks, 0);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasAudio || drag.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
    tracker.current.reset();
    tracker.current.push(performance.now(), 0);
    velocity.current = 0; // the hand stops the platter
    drag.current = {
      pointerId: e.pointerId,
      cx,
      cy,
      last: pointerAngle(cx, cy, e.clientX, e.clientY),
      net: 0,
      total: 0,
      startedAt: performance.now(),
      scratching: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const a = pointerAngle(d.cx, d.cy, e.clientX, e.clientY);
    const delta = unwrapDelta(d.last, a);
    d.last = a;
    d.net += delta;
    d.total += Math.abs(delta);
    angle.current += delta;
    tracker.current.push(performance.now(), d.net);
    if (!d.scratching && d.total > SCRATCH_THRESHOLD_DEG && owns && engine) {
      d.scratching = engine.beginScratch();
    } else if (!d.scratching && d.total > SCRATCH_THRESHOLD_DEG && !owns) {
      setScratchMode('visual');
    }
  };

  const finish = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (d.scratching) {
      // The worklet has reported by now whether it had audio to scrub.
      setScratchMode(engine?.canScrub ? 'scrub' : 'effect');
      engine?.endScratch(d.net);
    } else if (!cancelled && d.total <= TAP_MAX_DEG && performance.now() - d.startedAt <= TAP_MAX_MS) {
      toggle();
    }
    // A flick on a stopped deck coasts; a playing deck spins back up from rest.
    const coast = reduced || engine?.isPlaying() ? 0 : tracker.current.velocity(performance.now());
    velocity.current = Math.max(-720, Math.min(720, coast));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasAudio) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle();
    } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && owns && engine) {
      e.preventDefault();
      const step = e.key === 'ArrowRight' ? 5 : -5;
      engine.seek(state.currentTime + step);
      angle.current += step * 6;
    }
  };

  const label = current && owns ? current.title : tracks[0]?.title;

  return (
    <div className={`tt tt-${size}${armOn ? ' tt-armed' : ''}${reduced ? ' tt-reduced' : ''}`} data-tracks={ids}>
      <div className="tt-plinth" aria-hidden="true" />
      <div
        className={`tt-platter${hasAudio ? '' : ' tt-disabled'}`}
        role="button"
        tabIndex={hasAudio ? 0 : -1}
        aria-disabled={!hasAudio}
        aria-pressed={hasAudio ? playing : undefined}
        aria-label={hasAudio ? `Turntable. ${playing ? 'Pause' : 'Play'} ${label ?? ''}` : 'Turntable. No audio available yet'}
        aria-describedby={hasAudio ? hintId : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={e => finish(e, false)}
        onPointerCancel={e => finish(e, true)}
        onLostPointerCapture={e => finish(e, true)}
        onKeyDown={onKeyDown}
        onContextMenu={e => e.preventDefault()}
      >
        <div ref={platterRef} className="disc tt-disc" aria-hidden="true">
          <div className="disc-label tt-label">
            {labelImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- label art is a small, already-sized asset
              <img src={labelImage} alt="" draggable={false} />
            ) : (
              <>
                <span>L<b>&amp;</b>A</span>
                {labelNote && <small>{labelNote}</small>}
              </>
            )}
          </div>
          <span className="tt-marker" />
        </div>
      </div>
      <svg className="tt-arm" viewBox="0 0 120 300" aria-hidden="true">
        <circle cx="90" cy="30" r="22" className="tt-arm-base" />
        <circle cx="90" cy="30" r="8" className="tt-arm-pivot" />
        <path d="M90 30 L96 210 L70 262" className="tt-arm-tube" />
        <rect x="54" y="254" width="26" height="34" rx="3" transform="rotate(28 67 271)" className="tt-arm-head" />
      </svg>
      {hasAudio && (
        <p id={hintId} className="tt-hint">
          Tap to play or pause. Drag the record to scratch. Arrow keys skip 5 seconds.
        </p>
      )}
      {showDiagnostics && (
        <p className="tt-diag" aria-live="polite">
          Scratch mode:{' '}
          {
            {
              none: 'not used yet',
              scrub: 'live scrub of recently played audio',
              effect: 'friction sound effect only (nothing recorded yet, or AudioWorklet unavailable)',
              visual: 'visual only (this deck is not the one playing)',
            }[scratchMode]
          }
        </p>
      )}
    </div>
  );
}
