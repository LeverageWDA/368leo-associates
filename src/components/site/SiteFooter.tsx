import Link from 'next/link';
import type { SocialLink } from '@/lib/catalog';
import { SocialLinks } from './SocialLinks';
import { CONTACT_NAV, SITE_NAV } from './nav-items';

export function SiteFooter({ socials }: { socials: SocialLink[] }) {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand-col">
          <Link href="/" className="footer-brand">LEO <span>&amp;</span> ASSOCIATES</Link>
          <p>Independent music label.</p>
        </div>
        <nav className="footer-nav" aria-label="Footer">
          {[...SITE_NAV, CONTACT_NAV].map(item => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div className="footer-social">
          <SocialLinks links={socials} className="footer-social-list" empty={<p className="footer-muted">Social channels coming soon.</p>} />
        </div>
      </div>
      <div className="footer-row">
        <span>© {new Date().getFullYear()} LEO &amp; ASSOCIATES</span>
        <p className="footer-credit">
          Developed by{' '}
          <a href="https://builtbyleverage.com" target="_blank" rel="noopener noreferrer">
            Built by Leverage<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
        <a href="#top" className="footer-top">BACK TO TOP ↑</a>
      </div>
      <div className="footer-wordmark" aria-hidden="true">
        LEO<em>&amp;</em>ASSOCIATES
      </div>
    </footer>
  );
}
