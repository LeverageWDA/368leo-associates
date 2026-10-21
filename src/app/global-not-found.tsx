import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Not found — Leo & Associates', robots: { index: false } };

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f7f6f2', color: '#111110', fontFamily: 'Arial, sans-serif' }}>
        <main style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ letterSpacing: '.14em', fontSize: 11, color: '#8a6a0f' }}>404 / NOT FOUND</p>
          <h1 style={{ fontSize: 40, letterSpacing: '-.04em', margin: '12px 0 24px' }}>This page isn&apos;t here.</h1>
          <Link href="/" style={{ color: 'inherit', borderBottom: '1px solid currentColor', paddingBottom: 4 }}>Back to Leo &amp; Associates</Link>
        </main>
      </body>
    </html>
  );
}
