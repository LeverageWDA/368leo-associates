import Link from 'next/link';

export function SiteHeader() {
  return (
    <>
      <header className="nav" id="top">
        <Link href="/#top" className="brand" aria-label="Leo and Associates home">
          <span className="brand-mark">
            L<span className="gold">&amp;</span>A<span className="brand-dot">.</span>
          </span>
          <span className="brand-name">
            LEO <span className="gold">&amp;</span> ASSOCIATES<small>INDEPENDENT MUSIC LABEL</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary">
          <Link href="/#release"><span className="nav-num">01</span>THE RELEASE</Link>
          <Link href="/#experience"><span className="nav-num">02</span>LISTEN</Link>
          <Link href="/#about"><span className="nav-num">03</span>THE LABEL</Link>
        </nav>
        <div className="nav-right">
          <Link href="/#connect" className="nav-contact">
            LET&apos;S CONNECT <span aria-hidden="true">↗</span>
          </Link>
          <button id="menuToggle" className="menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
            <span></span>
            <span></span>
          </button>
        </div>
        <span className="nav-progress" aria-hidden="true"></span>
      </header>

      <div className="mobile-menu" id="mobileMenu" aria-hidden="true">
        <div className="mobile-menu-head">
          EXPLORE THE LABEL <span>001—004</span>
        </div>
        <Link href="/#release">The release <span>01</span></Link>
        <Link href="/#experience">Listen <span>02</span></Link>
        <Link href="/#about">The label <span>03</span></Link>
        <Link href="/#connect">Connect <span>04</span></Link>
        <p>LEO &amp; ASSOCIATES / INDEPENDENT MUSIC LABEL</p>
      </div>
    </>
  );
}
