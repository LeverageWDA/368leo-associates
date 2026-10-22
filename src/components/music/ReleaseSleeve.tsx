import type { Release } from '@/lib/catalog';
import { RELEASE_TYPE_LABEL } from '@/lib/catalog';

/**
 * Release artwork. Shows the real cover when provided; otherwise a labelled
 * placeholder sleeve in the house style (never invented artwork).
 */
export function ReleaseSleeve({ release, size = 'md' }: { release: Pick<Release, 'title' | 'type' | 'coverUrl' | 'coverAlt' | 'artist'>; size?: 'sm' | 'md' | 'lg' }) {
  if (release.coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- cover URLs come from managed storage; sizing handled in CSS
      <img className={`sleeve sleeve-${size}`} src={release.coverUrl} alt={release.coverAlt ?? `${release.title} cover artwork`} />
    );
  }
  return (
    <div className={`sleeve sleeve-${size} sleeve-placeholder`} role="img" aria-label={`${release.title}: cover artwork not yet supplied`}>
      <span className="sleeve-top">
        <span>{release.artist.name}</span>
        <span>{RELEASE_TYPE_LABEL[release.type]}</span>
      </span>
      <span className="sleeve-mono" aria-hidden="true">L<b>&amp;</b>A</span>
      <span className="sleeve-bottom">{size === 'sm' ? 'Artwork pending' : 'Official artwork pending'}</span>
    </div>
  );
}
