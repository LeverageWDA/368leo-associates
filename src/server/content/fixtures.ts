import type { Artist, Release } from '@/lib/catalog';

/*
 * DEVELOPMENT FIXTURES — NOT LABEL CONTENT.
 *
 * Used only when ENABLE_DEV_FIXTURES=1 outside production (see repository.ts),
 * so page layouts, the player and the turntable can be built before the label
 * supplies real releases. Every name says "Dev fixture", audio is a
 * synthesised test signal, and links point at example.com (a reserved domain).
 */

const ARTIST = { slug: 'dev-fixture-artist', name: 'Dev Fixture Artist' };

export const FIXTURE_ARTISTS: Artist[] = [
  {
    id: 'fixture-artist-1',
    slug: ARTIST.slug,
    name: ARTIST.name,
    bio: 'Development placeholder. The real artist biography will be supplied by the label.',
    portraitUrl: null,
    socials: [],
    isFixture: true,
  },
];

export const FIXTURE_RELEASES: Release[] = [
  {
    id: 'fixture-release-1',
    slug: 'dev-fixture-ep',
    title: 'Dev Fixture EP',
    type: 'ep',
    artist: ARTIST,
    releaseDate: null,
    description: 'Development placeholder release used to build and test the release page, player and turntable.',
    coverUrl: null,
    coverAlt: null,
    catalogueNumber: null,
    tracks: [
      {
        id: 'fixture-track-1',
        position: 1,
        title: 'Test Signal A (92 BPM)',
        durationMs: 24000,
        playbackMode: 'full',
        audioUrl: '/dev-fixtures/audio/signal-a.wav',
        credits: [],
      },
      {
        id: 'fixture-track-2',
        position: 2,
        title: 'Test Signal B (120 BPM)',
        durationMs: 24000,
        playbackMode: 'preview',
        audioUrl: '/dev-fixtures/audio/signal-b.wav',
        credits: [],
      },
      {
        id: 'fixture-track-3',
        position: 3,
        title: 'Track Without Audio',
        durationMs: null,
        playbackMode: 'unavailable',
        audioUrl: null,
        credits: [],
      },
    ],
    credits: [{ role: 'Note', name: 'Development fixture — no real credits' }],
    links: [
      { platform: 'apple_music', url: 'https://example.com/dev-fixture/apple-music', label: null },
      { platform: 'shopify', url: 'https://example.com/dev-fixture/shopify', label: null },
    ],
    isFixture: true,
  },
  {
    id: 'fixture-release-2',
    slug: 'dev-fixture-single',
    title: 'Dev Fixture Single',
    type: 'single',
    artist: ARTIST,
    releaseDate: null,
    description: null,
    coverUrl: null,
    coverAlt: null,
    catalogueNumber: null,
    tracks: [
      { id: 'fixture-track-4', position: 1, title: 'Unreleased Audio', durationMs: null, playbackMode: 'unavailable', audioUrl: null, credits: [] },
    ],
    credits: [],
    links: [],
    isFixture: true,
  },
];
