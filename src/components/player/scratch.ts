/*
 * Web Audio side of the turntable.
 *
 *   <audio> ─ MediaElementSource ─┬─ musicGain ───────────────→ speakers
 *                                 └─ scratch worklet ─ scratchGain → speakers
 *   looped noise ─ band-pass ─ noiseGain ────────────────────────→ speakers
 *
 * - While music plays, the worklet records the last 8 s of it.
 * - begin(): the music path fades out (the engine then pauses the element) and
 *   the worklet plays its recording back at the hand's speed and direction.
 * - The noise layer is a "vinyl friction" sound that follows hand speed. When
 *   nothing has been recorded yet, or AudioWorklet is unsupported, it is the
 *   only scratch sound: a sound effect, not real scrubbing.
 */

const WORKLET_URL = '/worklets/scratch-processor.js';

export class ScratchDeck {
  private readonly music: GainNode;
  private readonly scratchOut: GainNode;
  private readonly noiseGain: GainNode;
  private readonly band: BiquadFilterNode;
  private noiseSource: AudioBufferSourceNode | null = null;
  private node: AudioWorkletNode | null = null;
  private rate: AudioParam | null = null;
  /** Seconds of recorded audio available for the current scratch (reported by the worklet). */
  private available = 0;

  constructor(
    readonly ctx: AudioContext,
    source: MediaElementAudioSourceNode,
  ) {
    this.music = ctx.createGain();
    source.connect(this.music).connect(ctx.destination);

    this.scratchOut = ctx.createGain();
    this.scratchOut.gain.value = 0;
    this.scratchOut.connect(ctx.destination);

    this.band = ctx.createBiquadFilter();
    this.band.type = 'bandpass';
    this.band.Q.value = 0.9;
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0;
    this.band.connect(this.noiseGain).connect(ctx.destination);

    if (ctx.audioWorklet) {
      ctx.audioWorklet
        .addModule(WORKLET_URL)
        .then(() => {
          const node = new AudioWorkletNode(ctx, 'scratch-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
          });
          node.port.onmessage = e => {
            if (e.data?.type === 'frozen') this.available = Number(e.data.seconds) || 0;
          };
          source.connect(node);
          node.connect(this.scratchOut);
          this.node = node;
          this.rate = node.parameters.get('rate') ?? null;
        })
        .catch(() => {
          // Friction-only fallback; playback is unaffected.
        });
    }
  }

  /** True when the current (or last) scratch had recorded audio to scrub. */
  get canScrub(): boolean {
    return this.node !== null && this.available > 0.1;
  }

  setCapturing(on: boolean): void {
    this.node?.port.postMessage({ type: 'capture', on });
  }

  /** Clear recorded audio after a seek or track change. */
  reset(): void {
    this.node?.port.postMessage({ type: 'reset' });
  }

  begin(): void {
    const t = this.ctx.currentTime;
    this.music.gain.cancelScheduledValues(t);
    this.music.gain.setTargetAtTime(0, t, 0.006);
    this.available = 0;
    this.node?.port.postMessage({ type: 'freeze' });
    this.rate?.cancelScheduledValues(t);
    this.rate?.setValueAtTime(0, t);
    this.scratchOut.gain.cancelScheduledValues(t);
    this.scratchOut.gain.setTargetAtTime(1, t, 0.004);
    this.ensureNoise();
  }

  /** `rate`: 1 = normal speed forwards, negative = backwards, 0 = held. */
  setRate(rate: number): void {
    const t = this.ctx.currentTime;
    this.rate?.setTargetAtTime(rate, t, 0.012);
    const speed = Math.min(1, Math.abs(rate) / 2);
    const level = (this.canScrub ? 0.035 : 0.09) * speed;
    this.noiseGain.gain.setTargetAtTime(level, t, 0.02);
    this.band.frequency.setTargetAtTime(500 + 2800 * speed, t, 0.02);
  }

  /**
   * Hand released. `rewindSeconds` = how far before the grab point playback
   * resumes (the recording is trimmed to match), or null when it resumes at or
   * after the grab point (the recording is cleared).
   */
  end(rewindSeconds: number | null): void {
    const t = this.ctx.currentTime;
    this.rate?.setTargetAtTime(0, t, 0.01);
    this.scratchOut.gain.setTargetAtTime(0, t, 0.01);
    this.noiseGain.gain.setTargetAtTime(0, t, 0.02);
    const rewind = rewindSeconds == null ? -1 : Math.round(rewindSeconds * this.ctx.sampleRate);
    this.node?.port.postMessage({ type: 'release', rewind });
    this.music.gain.cancelScheduledValues(t);
    // ~150 ms fade back in once the element has resumed.
    this.music.gain.setTargetAtTime(1, t + 0.03, 0.05);
  }

  private ensureNoise(): void {
    if (this.noiseSource) return;
    const len = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(this.band);
    src.start();
    this.noiseSource = src;
  }
}
