import { describe, expect, it } from 'vitest';
import { formatDuration, isSafeExternalUrl, playableTracks, type Release } from '@/lib/catalog';
import { parseRange } from '@/lib/http-range';
import { isTestSignalName, testSignalWav } from '@/server/content/test-signal';

describe('parseRange', () => {
  it('serves the whole file without a Range header', () => {
    expect(parseRange(null, 100)).toBeNull();
  });
  it('parses closed, open and suffix ranges', () => {
    expect(parseRange('bytes=0-9', 100)).toEqual({ start: 0, end: 9 });
    expect(parseRange('bytes=90-', 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange('bytes=50-1000', 100)).toEqual({ start: 50, end: 99 });
  });
  it('rejects ranges outside the resource', () => {
    expect(parseRange('bytes=100-', 100)).toBe('unsatisfiable');
    expect(parseRange('bytes=9-3', 100)).toBe('unsatisfiable');
  });
  it('ignores malformed and multi-range headers', () => {
    expect(parseRange('items=0-1', 100)).toBeNull();
    expect(parseRange('bytes=0-1,5-6', 100)).toBeNull();
  });
});

describe('dev test signal', () => {
  it('only knows its own file names', () => {
    expect(isTestSignalName('signal-a.wav')).toBe(true);
    expect(isTestSignalName('../secret')).toBe(false);
    expect(isTestSignalName('constructor')).toBe(false);
  });
  it('produces a valid mono 16-bit PCM WAV', () => {
    const wav = testSignalWav('signal-a.wav');
    const dv = new DataView(wav.buffer);
    const tag = (o: number) => String.fromCharCode(...wav.slice(o, o + 4));
    expect(tag(0)).toBe('RIFF');
    expect(tag(8)).toBe('WAVE');
    expect(dv.getUint16(22, true)).toBe(1);
    expect(dv.getUint16(34, true)).toBe(16);
    expect(dv.getUint32(40, true)).toBe(wav.byteLength - 44);
  });
});

describe('catalogue helpers', () => {
  const release = {
    slug: 'r', title: 'R', type: 'ep', artist: { slug: 'a', name: 'A' }, coverUrl: null,
    tracks: [
      { id: '1', position: 1, title: 'Full', durationMs: 1000, playbackMode: 'full', audioUrl: '/a.wav', credits: [] },
      { id: '2', position: 2, title: 'No audio', durationMs: null, playbackMode: 'full', audioUrl: null, credits: [] },
      { id: '3', position: 3, title: 'Blocked', durationMs: null, playbackMode: 'unavailable', audioUrl: '/c.wav', credits: [] },
    ],
  } as unknown as Release;

  it('queues only tracks with authorised audio that may be played', () => {
    expect(playableTracks(release).map(t => t.id)).toEqual(['1']);
  });
  it('formats durations and unknowns', () => {
    expect(formatDuration(83_000)).toBe('1:23');
    expect(formatDuration(null)).toBe('—');
  });
  it('allows only https outbound links', () => {
    expect(isSafeExternalUrl('https://music.apple.com/x')).toBe(true);
    expect(isSafeExternalUrl('http://example.com')).toBe(false);
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('not a url')).toBe(false);
  });
});
