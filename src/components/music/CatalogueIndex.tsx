'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RELEASE_TYPE_LABEL, type Release, type ReleaseType } from '@/lib/catalog';
import { ReleaseSleeve } from './ReleaseSleeve';

const ORDER: ReleaseType[] = ['album', 'ep', 'single'];
const PLURAL: Record<ReleaseType, string> = { album: 'Albums', ep: 'EPs', single: 'Singles' };

/** Catalogue rows with a format filter. Only formats that exist get a filter. */
export function CatalogueIndex({ releases }: { releases: Release[] }) {
  const [filter, setFilter] = useState<ReleaseType | 'all'>('all');
  const formats = ORDER.filter(t => releases.some(r => r.type === t));
  const shown = filter === 'all' ? releases : releases.filter(r => r.type === filter);

  return (
    <>
      {formats.length > 1 && (
        <div className="cat-filter" role="group" aria-label="Filter by format">
          {(['all', ...formats] as const).map(f => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : PLURAL[f]}
              <span>{f === 'all' ? releases.length : releases.filter(r => r.type === f).length}</span>
            </button>
          ))}
        </div>
      )}
      <ol className="cat-list">
        {shown.map((r, i) => (
          <li key={r.slug}>
            <Link href={`/music/${r.slug}`} className="cat-row">
              <span className="cat-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="cat-sleeve"><ReleaseSleeve release={r} size="sm" /></span>
              <span className="cat-title">{r.title}</span>
              <span className="cat-artist">{r.artist.name}</span>
              <span className="cat-meta">
                {RELEASE_TYPE_LABEL[r.type]}
                {r.releaseDate ? ` · ${r.releaseDate.slice(0, 4)}` : ''}
              </span>
              <span className="cat-arrow" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
