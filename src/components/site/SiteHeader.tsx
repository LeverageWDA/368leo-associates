'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { SocialLink } from '@/lib/catalog';
import { SocialLinks } from './SocialLinks';
import { CONTACT_NAV, SITE_NAV } from './nav-items';

export function SiteHeader({ socials }: { socials: SocialLink[] }) {
  const pathname = usePathname();
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Escape closes; page scroll is locked while open.
  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenOn(null);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('menu-open');
    };
  }, [open]);

  return (
    <>
      <header className="nav" id="top">
        <Link href="/" className="brand" aria-label="Leo & Associates home">
          <span className="brand-mark" aria-hidden="true">
            L<span className="gold">&amp;</span>A<span className="brand-dot">.</span>
          </span>
          <span className="brand-name">
            LEO <span className="gold">&amp;</span> ASSOCIATES<small>INDEPENDENT MUSIC LABEL</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary">
          {SITE_NAV.map(item => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
              {item.label.toUpperCase()}
            </Link>
          ))}
        </nav>
        <div className="nav-right">
          <Link href={CONTACT_NAV.href} className="nav-contact" aria-current={isActive(CONTACT_NAV.href) ? 'page' : undefined}>
            CONTACT <span aria-hidden="true">↗</span>
          </Link>
          <button
            type="button"
            id="menuToggle"
            className={`menu-toggle${open ? ' active' : ''}`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobileMenu"
            onClick={() => setOpen(!open)}
          >
            <span></span>
            <span></span>
          </button>
        </div>
        <span className="nav-progress" aria-hidden="true"></span>
      </header>

      <div className={`mobile-menu${open ? ' active' : ''}`} id="mobileMenu" aria-hidden={!open} inert={!open}>
        <Link href="/" className="mobile-menu-home">Home</Link>
        {[...SITE_NAV, CONTACT_NAV].map(item => (
          <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
            {item.label}
          </Link>
        ))}
        <SocialLinks links={socials} className="mobile-menu-social" />
        <p>LEO &amp; ASSOCIATES / INDEPENDENT MUSIC LABEL</p>
      </div>
    </>
  );
}
