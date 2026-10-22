import { parseRange } from '@/lib/http-range';
import { devFixturesEnabled } from '@/server/content/repository';
import { isTestSignalName, testSignalWav } from '@/server/content/test-signal';

// Gated at request time; returns 404 unless development fixtures are enabled.
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ file: string }> };

async function serve(request: Request, ctx: Ctx, head: boolean) {
  const { file } = await ctx.params;
  if (!devFixturesEnabled() || !isTestSignalName(file)) return new Response('Not found', { status: 404 });

  const body = testSignalWav(file);
  const size = body.byteLength;
  const headers = new Headers({
    'Content-Type': 'audio/wav',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
  });

  const range = parseRange(request.headers.get('range'), size);
  if (range === 'unsatisfiable') {
    headers.set('Content-Range', `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  if (range) {
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
    headers.set('Content-Length', String(range.end - range.start + 1));
    return new Response(head ? null : body.slice(range.start, range.end + 1), { status: 206, headers });
  }
  headers.set('Content-Length', String(size));
  return new Response(head ? null : body, { status: 200, headers });
}

export function GET(request: Request, ctx: Ctx) {
  return serve(request, ctx, false);
}

export function HEAD(request: Request, ctx: Ctx) {
  return serve(request, ctx, true);
}
