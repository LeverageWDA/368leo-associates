/*
 * Synthesised DEVELOPMENT TEST SIGNALS — not music, not label content.
 * A drum-machine-style pulse with a held chord, so play/pause, seeking and
 * turntable scratching can be heard and tested before licensed audio exists.
 * Generated deterministically on the server; no audio files are committed.
 */

const SAMPLE_RATE = 22050;
const SECONDS = 24;

const SIGNALS = {
  'signal-a.wav': { bpm: 92, chord: [220, 261.63, 329.63] }, // A minor
  'signal-b.wav': { bpm: 120, chord: [261.63, 329.63, 392] }, // C major
} as const;

export type TestSignalName = keyof typeof SIGNALS;

export function isTestSignalName(name: string): name is TestSignalName {
  return Object.hasOwn(SIGNALS, name);
}

const cache = new Map<TestSignalName, Uint8Array<ArrayBuffer>>();

export function testSignalWav(name: TestSignalName): Uint8Array<ArrayBuffer> {
  const hit = cache.get(name);
  if (hit) return hit;

  const { bpm, chord } = SIGNALS[name];
  const n = SAMPLE_RATE * SECONDS;
  const beat = (60 / bpm) * SAMPLE_RATE;
  const samples = new Int16Array(n);
  let seed = 0x2545f491; // deterministic noise

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const inBeat = i % beat;
    const tb = inBeat / SAMPLE_RATE;
    // kick: falling sine with fast decay
    const kick = Math.sin(2 * Math.PI * (50 + 90 * Math.exp(-tb * 30)) * tb) * Math.exp(-tb * 9);
    // hat on the off-beat: short noise burst
    const off = (i + beat / 2) % beat;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const hat = ((seed / 0xffffffff) * 2 - 1) * Math.exp(-(off / SAMPLE_RATE) * 60) * 0.35;
    // held chord with a slow swell, so scratching has pitch to bend
    const pad = chord.reduce((s, f) => s + Math.sin(2 * Math.PI * f * t), 0) / chord.length;
    const swell = 0.18 + 0.07 * Math.sin(2 * Math.PI * t / 8);
    const v = kick * 0.55 + hat + pad * swell;
    samples[i] = Math.max(-1, Math.min(1, v * 0.8)) * 0x7fff;
  }

  const wav = new Uint8Array(44 + samples.byteLength);
  const dv = new DataView(wav.buffer);
  const str = (o: number, s: string) => [...s].forEach((c, k) => dv.setUint8(o + k, c.charCodeAt(0)));
  str(0, 'RIFF');
  dv.setUint32(4, 36 + samples.byteLength, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); // PCM
  dv.setUint16(22, 1, true); // mono
  dv.setUint32(24, SAMPLE_RATE, true);
  dv.setUint32(28, SAMPLE_RATE * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  str(36, 'data');
  dv.setUint32(40, samples.byteLength, true);
  wav.set(new Uint8Array(samples.buffer), 44);

  cache.set(name, wav);
  return wav;
}
