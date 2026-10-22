export type ByteRange = { start: number; end: number };

/**
 * Parses a single-range `Range: bytes=…` header for a resource of `size` bytes.
 * Returns null when there is no usable Range header (serve the whole file) and
 * 'unsatisfiable' when the range lies outside the resource (respond 416).
 * Multi-range requests are answered with the whole file, which RFC 9110 allows.
 */
export function parseRange(header: string | null, size: number): ByteRange | 'unsatisfiable' | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return null;
  const [, a = '', b = ''] = m;
  if (a === '' && b === '') return null;

  let start: number;
  let end: number;
  if (a === '') {
    // Suffix range: the last N bytes.
    const n = Number(b);
    if (n === 0) return 'unsatisfiable';
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(a);
    end = b === '' ? size - 1 : Math.min(Number(b), size - 1);
  }
  if (start >= size || start > end) return 'unsatisfiable';
  return { start, end };
}
