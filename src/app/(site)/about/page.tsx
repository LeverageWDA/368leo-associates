import type { Metadata } from 'next';
import Link from 'next/link';
import { Pending } from '@/components/site/PageMarkers';

export const metadata: Metadata = {
  title: 'About',
  description: 'Leo & Associates is an independent music label.',
  alternates: { canonical: '/about' },
};

/*
 * Long-form label page. Only the approved line ("an independent music label")
 * is stated; every other passage is a labelled slot for the founder's text.
 */
export default function AboutPage() {
  return (
    <main id="main" className="pg pg-about">
      <header className="about-hero">
        <p className="pg-kicker">About the label</p>
        <h1 className="about-statement">
          An independent <em>music label.</em>
        </h1>
      </header>

      <div className="about-chapters">
        <section className="about-chapter" aria-labelledby="ch-label">
          <h2 id="ch-label"><span>I.</span> The label</h2>
          <div>
            <p className="about-lede">Leo &amp; Associates is an independent music label.</p>
            <Pending>Why the label exists and what it stands for, as approved by the founder.</Pending>
          </div>
        </section>
        <section className="about-chapter" aria-labelledby="ch-founder">
          <h2 id="ch-founder"><span>II.</span> The founder</h2>
          <div>
            <Pending>The founder&apos;s story: background, influences and the road to the label.</Pending>
          </div>
        </section>
        <section className="about-chapter" aria-labelledby="ch-sound">
          <h2 id="ch-sound"><span>III.</span> The sound</h2>
          <div>
            <Pending>The music the label champions and the culture it comes from.</Pending>
          </div>
        </section>
      </div>

      <section className="about-next">
        <Link href="/music" className="about-next-link"><span>Hear the music</span> <span aria-hidden="true">→</span></Link>
        <Link href="/contact" className="about-next-link"><span>Work with the label</span> <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
