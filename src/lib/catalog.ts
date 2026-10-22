/*
 * Public catalogue types, shared by server pages and client components.
 * These are the shapes the public site renders; the database (or, in
 * development only, labelled fixtures) supplies them. Optional fields are null
 * when the label has not provided them — never filled with guesses.
 */

export type ReleaseType = 'single' | 'ep' | 'album';
export type PlaybackMode = 'full' | 'preview' | 'unavailable';

export type PlatformKey =
  | 'apple_music'
  | 'spotify'
  | 'youtube_music'
  | 'amazon_music'
  | 'tidal'
  | 'bandcamp'
  | 'soundcloud'
  | 'shopify'
  | 'other';

export type SocialNetwork = 'instagram' | 'tiktok' | 'youtube' | 'x' | 'facebook' | 'threads' | 'soundcloud' | 'other';

export interface PlatformLink {
  platform: PlatformKey;
  url: string;
  label: string | null;
}

export interface SocialLink {
  network: SocialNetwork;
  url: string;
  /** Display handle exactly as the label supplied it, e.g. "@name". */
  handle: string | null;
}

export interface Credit {
  role: string;
  name: string;
}

export interface Track {
  id: string;
  position: number;
  title: string;
  durationMs: number | null;
  playbackMode: PlaybackMode;
  /** Public playback URL; null when there is no authorised audio. */
  audioUrl: string | null;
  credits: Credit[];
}

export interface ArtistRef {
  slug: string;
  name: string;
}

export interface Release {
  id: string;
  slug: string;
  title: string;
  type: ReleaseType;
  artist: ArtistRef;
  releaseDate: string | null;
  description: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
  catalogueNumber: string | null;
  tracks: Track[];
  credits: Credit[];
  /** Streaming and store destinations, verified by an owner before publishing. */
  links: PlatformLink[];
  isFixture: boolean;
}

export interface Artist {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  portraitUrl: string | null;
  socials: SocialLink[];
  isFixture: boolean;
}

export interface ContactRoute {
  kind: 'general' | 'bookings' | 'press' | 'collaboration' | 'licensing';
  email: string;
}

export interface SiteSettings {
  socials: SocialLink[];
  contact: ContactRoute[];
  shopifyStoreUrl: string | null;
}

/** What the player needs to play one track. Built from a Release + Track. */
export interface PlayableTrack {
  id: string;
  title: string;
  artistName: string;
  releaseTitle: string;
  releaseSlug: string;
  src: string;
  artworkUrl: string | null;
  playbackMode: Exclude<PlaybackMode, 'unavailable'>;
}

export const RELEASE_TYPE_LABEL: Record<ReleaseType, string> = { single: 'Single', ep: 'EP', album: 'Album' };

export const PLATFORM_LABEL: Record<PlatformKey, string> = {
  apple_music: 'Apple Music',
  spotify: 'Spotify',
  youtube_music: 'YouTube Music',
  amazon_music: 'Amazon Music',
  tidal: 'TIDAL',
  bandcamp: 'Bandcamp',
  soundcloud: 'SoundCloud',
  shopify: 'Shopify',
  other: 'Listen',
};

export const SOCIAL_LABEL: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X',
  facebook: 'Facebook',
  threads: 'Threads',
  soundcloud: 'SoundCloud',
  other: 'Link',
};

export const CONTACT_LABEL: Record<ContactRoute['kind'], string> = {
  general: 'General',
  bookings: 'Bookings',
  press: 'Press',
  collaboration: 'Collaboration',
  licensing: 'Licensing',
};

/** Tracks that may be played on the site, in tracklist order. */
export function playableTracks(release: Release): PlayableTrack[] {
  return release.tracks
    .filter((t): t is Track & { audioUrl: string; playbackMode: 'full' | 'preview' } => t.playbackMode !== 'unavailable' && !!t.audioUrl)
    .map(t => ({
      id: t.id,
      title: t.title,
      artistName: release.artist.name,
      releaseTitle: release.title,
      releaseSlug: release.slug,
      src: t.audioUrl,
      artworkUrl: release.coverUrl,
      playbackMode: t.playbackMode,
    }));
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Only https URLs are rendered as outbound links. */
export function isSafeExternalUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}
