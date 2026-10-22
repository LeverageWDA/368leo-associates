import type { PlayableTrack } from '@/lib/catalog';
import { resumePosition } from '@/components/turntable/physics';
import { ScratchDeck } from './scratch';

/*
 * The site's one audio engine: a single HTMLAudioElement shared by every page,
 * the mini player, the full player and the turntables. Lives in the public
 * layout, so it survives client-side navigation.
 *
 * - Nothing plays without a user gesture: play() is only called from click,
 *   key or pointer handlers.
 * - Only tracks the catalogue marks playable (with an authorised URL) can be
 *   queued; there is no fallback or fake audio.
 * - The Web Audio graph (needed for scratching) is created inside the first
 *   play gesture, as iOS Safari requires.
 */

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface PlayerState {
  queue: PlayableTrack[];
  index: number;
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  /** iOS ignores element volume; the UI hides its slider when false. */
  volumeSupported: boolean;
  scratching: boolean;
  error: string | null;
}

export type PlayerEvent =
  | { name: 'track_play_started'; trackId: string; releaseSlug: string }
  | { name: 'track_play_completed'; trackId: string; releaseSlug: string };

export const IDLE_STATE: PlayerState = {
  queue: [],
  index: -1,
  status: 'idle',
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  volumeSupported: true,
  scratching: false,
  error: null,
};

type Listener = () => void;

export class AudioEngine {
  readonly audio: HTMLAudioElement;
  private state: PlayerState = IDLE_STATE;
  private listeners = new Set<Listener>();
  private ctx: AudioContext | null = null;
  private deck: ScratchDeck | null = null;
  private scratch: { grabTime: number; wasPlaying: boolean } | null = null;
  private startedFor: string | null = null;
  private cleanup: (() => void)[] = [];
  /** Analytics hook; wired to the analytics provider in a later phase. */
  onEvent: (event: PlayerEvent) => void = () => {};

  constructor() {
    const audio = new Audio();
    audio.preload = 'metadata';
    // Lets Web Audio read cross-origin media (storage must send CORS headers).
    audio.crossOrigin = 'anonymous';
    this.audio = audio;

    audio.volume = 0.5;
    const volumeSupported = audio.volume === 0.5;
    audio.volume = 1;
    this.state = { ...IDLE_STATE, volumeSupported };

    const on = <K extends keyof HTMLMediaElementEventMap>(type: K, fn: () => void) => {
      audio.addEventListener(type, fn);
      this.cleanup.push(() => audio.removeEventListener(type, fn));
    };
    on('loadstart', () => this.patch({ status: 'loading', error: null }));
    on('waiting', () => {
      this.deck?.setCapturing(false);
      if (!this.scratch) this.patch({ status: 'loading' });
    });
    on('playing', () => {
      this.deck?.setCapturing(true);
      this.patch({ status: 'playing', error: null });
      const track = this.current();
      if (track && this.startedFor !== track.id) {
        this.startedFor = track.id;
        this.onEvent({ name: 'track_play_started', trackId: track.id, releaseSlug: track.releaseSlug });
      }
    });
    on('pause', () => {
      this.deck?.setCapturing(false);
      if (!this.scratch) this.patch({ status: 'paused' });
    });
    on('timeupdate', () => this.patch({ currentTime: audio.currentTime }));
    on('durationchange', () => this.patch({ duration: Number.isFinite(audio.duration) ? audio.duration : 0 }));
    on('volumechange', () => this.patch({ volume: audio.volume, muted: audio.muted }));
    on('ended', () => {
      this.deck?.setCapturing(false);
      const track = this.current();
      if (track) this.onEvent({ name: 'track_play_completed', trackId: track.id, releaseSlug: track.releaseSlug });
      if (this.state.index < this.state.queue.length - 1) this.loadIndex(this.state.index + 1, true);
      else this.patch({ status: 'paused', currentTime: 0 });
    });
    on('error', () => {
      if (!audio.getAttribute('src')) return;
      this.patch({ status: 'error', error: 'This track could not be loaded.' });
    });

    const onVisible = () => {
      if (document.visibilityState === 'visible' && this.ctx?.state === 'suspended') void this.ctx.resume();
    };
    document.addEventListener('visibilitychange', onVisible);
    this.cleanup.push(() => document.removeEventListener('visibilitychange', onVisible));
    this.setupMediaSession();
  }

  // ---- store -------------------------------------------------------------
  getSnapshot = (): PlayerState => this.state;

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private patch(p: Partial<PlayerState>): void {
    this.state = { ...this.state, ...p };
    this.listeners.forEach(l => l());
  }

  current(): PlayableTrack | null {
    return this.state.queue[this.state.index] ?? null;
  }

  /** Read directly by the turntable every frame (no React re-render). */
  isPlaying(): boolean {
    return !this.audio.paused && !this.scratch;
  }

  // ---- transport (call from user gestures) ---------------------------------
  playQueue(queue: PlayableTrack[], index = 0): void {
    if (!queue[index]) return;
    const sameTrack = this.current()?.id === queue[index].id;
    this.patch({ queue });
    if (sameTrack) {
      this.patch({ index });
      this.play();
    } else {
      this.loadIndex(index, true);
    }
  }

  play(): void {
    if (!this.current()) return;
    this.ensureAudioGraph();
    this.audio.play().catch((err: unknown) => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      this.patch({ status: err instanceof DOMException && err.name === 'NotAllowedError' ? 'paused' : 'error' });
    });
  }

  pause(): void {
    this.audio.pause();
  }

  toggle(): void {
    if (this.audio.paused) this.play();
    else this.pause();
  }

  next(): void {
    if (this.state.index < this.state.queue.length - 1) this.loadIndex(this.state.index + 1, !this.audio.paused);
  }

  previous(): void {
    if (this.audio.currentTime > 3 || this.state.index === 0) this.seek(0);
    else this.loadIndex(this.state.index - 1, !this.audio.paused);
  }

  seek(seconds: number): void {
    const d = this.state.duration || this.audio.duration;
    const t = Math.max(0, Math.min(Number.isFinite(d) && d > 0 ? d - 0.05 : seconds, seconds));
    this.audio.currentTime = t;
    this.deck?.reset();
    this.patch({ currentTime: t });
  }

  setVolume(v: number): void {
    this.audio.volume = Math.max(0, Math.min(1, v));
    if (this.audio.muted && v > 0) this.audio.muted = false;
  }

  toggleMute(): void {
    this.audio.muted = !this.audio.muted;
  }

  // ---- scratching (driven by the turntable) --------------------------------
  /** Hand lands on the record. Returns false when nothing is loaded. */
  beginScratch(): boolean {
    if (!this.current() || this.scratch) return false;
    this.ensureAudioGraph();
    this.scratch = { grabTime: this.audio.currentTime, wasPlaying: !this.audio.paused };
    this.deck?.begin();
    this.patch({ scratching: true });
    // Pause once the music path has faded (6 ms time constant), avoiding a click.
    window.setTimeout(() => {
      if (this.scratch) this.audio.pause();
    }, this.deck ? 30 : 0);
    return true;
  }

  updateScratch(rate: number): void {
    if (this.scratch) this.deck?.setRate(rate);
  }

  /** Hand released after `netDegrees` of rotation (positive = forwards). */
  endScratch(netDegrees: number): void {
    const s = this.scratch;
    if (!s) return;
    const duration = this.state.duration || this.audio.duration;
    const to = resumePosition(s.grabTime, netDegrees, duration);
    this.deck?.end(to <= s.grabTime ? s.grabTime - to : null);
    this.audio.currentTime = to;
    this.scratch = null;
    this.patch({ scratching: false, currentTime: to, status: s.wasPlaying ? 'playing' : 'paused' });
    if (s.wasPlaying) this.play();
  }

  get canScrub(): boolean {
    return this.deck?.canScrub ?? false;
  }

  // ---- internals ------------------------------------------------------------
  private loadIndex(index: number, autoplay: boolean): void {
    const track = this.state.queue[index];
    if (!track) return;
    this.deck?.reset();
    this.startedFor = null;
    this.audio.src = track.src;
    this.patch({ index, currentTime: 0, duration: 0, status: 'loading', error: null });
    this.updateMediaMetadata(track);
    if (autoplay) this.play();
  }

  private ensureAudioGraph(): void {
    if (!this.ctx) {
      const Ctx: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      try {
        const ctx = new Ctx({ latencyHint: 'interactive' });
        const source = ctx.createMediaElementSource(this.audio);
        this.ctx = ctx;
        this.deck = new ScratchDeck(ctx, source);
      } catch {
        // Without Web Audio the element plays directly; scratching is visual only.
        return;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private setupMediaSession(): void {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const set = (action: MediaSessionAction, fn: MediaSessionActionHandler) => {
      try {
        ms.setActionHandler(action, fn);
      } catch {
        // Action not supported by this browser.
      }
    };
    set('play', () => this.play());
    set('pause', () => this.pause());
    set('nexttrack', () => this.next());
    set('previoustrack', () => this.previous());
    set('seekto', d => d.seekTime != null && this.seek(d.seekTime));
  }

  private updateMediaMetadata(track: PlayableTrack): void {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artistName,
      album: track.releaseTitle,
      artwork: track.artworkUrl ? [{ src: track.artworkUrl }] : [],
    });
  }

  dispose(): void {
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    this.cleanup.forEach(fn => fn());
    void this.ctx?.close();
    this.listeners.clear();
  }
}
