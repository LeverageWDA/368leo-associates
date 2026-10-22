import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TransportControls } from '@/components/player/TransportControls';
import { Turntable } from '@/components/turntable/Turntable';
import { playableTracks } from '@/lib/catalog';
import { devFixturesEnabled, getRelease } from '@/server/content/repository';

export const metadata: Metadata = { title: 'Turntable prototype', robots: { index: false, follow: false } };

/*
 * Isolated prototype of the turntable + scratch interaction, wired to the real
 * shared audio engine and the synthesised dev test signal. Only exists while
 * development fixtures are enabled.
 */
export default async function TurntableLab() {
  if (!devFixturesEnabled()) notFound();
  const release = await getRelease('dev-fixture-ep');
  const tracks = release ? playableTracks(release) : [];

  return (
    <main id="main" className="pg pg-lab">
      <header className="lab-head">
        <p className="pg-kicker pg-kicker-dark">Prototype · development only</p>
        <h1>Turntable lab</h1>
        <p>
          Plays a synthesised test signal through the site&apos;s real audio engine. Play first, then drag the record:
          backwards and forwards scrubs the last few seconds you heard; letting go drops playback back in where your
          hand left the record. Grabbing before anything has played gives the friction sound effect only.
        </p>
      </header>
      <div className="lab-grid">
        <div className="lab-deck"><Turntable tracks={tracks} labelNote="LAB" showDiagnostics /></div>
        <div className="lab-side">
          <TransportControls tone="dark" tracks={tracks} />
          <ul className="lab-notes">
            <li><b>Spin</b> 33⅓ rpm while playing, eases up and spins down — never a CSS loop.</li>
            <li><b>Scratch</b> starts after 6° of deliberate movement; a quick tap toggles play.</li>
            <li><b>Duck</b> the music fades out and pauses under your hand, then fades back in.</li>
            <li><b>Keyboard</b> focus the record: Space/Enter play/pause, ←/→ skip 5 seconds.</li>
            <li><b>Reduced motion</b> no automatic spinning or coasting; dragging still works.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
