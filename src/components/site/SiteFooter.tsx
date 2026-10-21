import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-row">
        <Link href="/#top" className="footer-brand">LEO <span>&amp;</span> ASSOCIATES</Link>
        <span>INDEPENDENT MUSIC LABEL</span>
        <Link href="/#top" className="footer-top">BACK TO TOP ↑</Link>
        <span>© 2026 LEO &amp; ASSOCIATES</span>
      </div>
      <div className="footer-wordmark" aria-hidden="true">
        LEO<em>&amp;</em>ASSOCIATES
      </div>
    </footer>
  );
}
