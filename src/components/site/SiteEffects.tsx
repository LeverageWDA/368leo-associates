'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/*
 * Port of the prototype's script.js. Behaviour is unchanged; the differences
 * are React lifecycle concerns: every listener, observer and animation frame is
 * torn down on unmount, every element lookup tolerates the element being
 * absent (so the same layout works on pages without a listening room), and the
 * effect re-runs on route change.
 *   1. Mobile menu
 *   2. Player overlay + mini player
 *   3. Choreography: line reveals, scroll-linked art, marquee velocity,
 *      nav progress / auto-hide, magnetic buttons, nebula pointer drift
 */
export function SiteEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;
    const observers: IntersectionObserver[] = [];
    const frames = new Set<number>();
    const raf = (fn: FrameRequestCallback) => {
      const id = requestAnimationFrame(t => {
        frames.delete(id);
        fn(t);
      });
      frames.add(id);
    };
    const body = document.body;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- 1. Mobile menu ---------- */
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    function setMenu(open: boolean) {
      if (!menuToggle || !mobileMenu) return;
      mobileMenu.classList.toggle('active', open);
      menuToggle.classList.toggle('active', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      mobileMenu.setAttribute('aria-hidden', String(!open));
      body.classList.toggle('menu-open', open);
    }
    const closeMenu = () => setMenu(false);
    menuToggle?.addEventListener('click', () => setMenu(!mobileMenu?.classList.contains('active')), { signal });
    mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu, { signal }));

    /* ---------- 2. Player overlay ---------- */
    const overlay = document.getElementById('playerOverlay');
    const closeBtn = document.getElementById('closePlayer');
    let previousFocus: HTMLElement | null = null;

    function openPlayer() {
      if (!overlay) return;
      previousFocus = document.activeElement as HTMLElement | null;
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      body.classList.add('overlay-open');
      // wait a frame so the dialog is visible before moving focus into it
      raf(() => raf(() => closeBtn?.focus()));
    }
    function closePlayer() {
      if (!overlay) return;
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      body.classList.remove('overlay-open');
      previousFocus?.focus();
    }
    document.getElementById('openPlayer')?.addEventListener('click', openPlayer, { signal });
    document.getElementById('expandPlayer')?.addEventListener('click', openPlayer, { signal });
    closeBtn?.addEventListener('click', closePlayer, { signal });

    document.addEventListener(
      'keydown',
      e => {
        const overlayOpen = overlay?.classList.contains('active');
        if (e.key === 'Escape') {
          if (overlayOpen) closePlayer();
          else closeMenu();
        }
        if (e.key === 'Tab' && overlayOpen && overlay) {
          const focusables = [...overlay.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]')];
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      },
      { signal },
    );

    /* mini player appears once the listening room has scrolled past */
    const mini = document.getElementById('miniPlayer');
    const experience = document.getElementById('experience');
    if (mini && experience) {
      const io = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            const on = !entry.isIntersecting && entry.boundingClientRect.top < 0;
            mini.classList.toggle('visible', on);
            body.classList.toggle('mini-on', on);
          }
        },
        { threshold: 0 },
      );
      io.observe(experience);
      observers.push(io);
    }
    /* park it while the footer is on screen so it never covers footer links */
    const footer = document.querySelector('.footer');
    if (mini && footer) {
      const io = new IntersectionObserver(([entry]) => mini.classList.toggle('parked', !!entry?.isIntersecting), {
        threshold: 0,
      });
      io.observe(footer);
      observers.push(io);
    }

    /* ---------- 3a. Fit guard: no display line may overflow its column ---------- */
    function fitLines() {
      document.querySelectorAll<HTMLElement>('.split .line, .footer-wordmark').forEach(line => {
        line.style.fontSize = '';
        const isWordmark = line.classList.contains('footer-wordmark');
        const inner = isWordmark ? line : (line.firstElementChild as HTMLElement | null);
        const parent = line.parentElement;
        if (!inner || !parent) return;
        const parentCs = getComputedStyle(parent);
        const box = parent.clientWidth - parseFloat(parentCs.paddingLeft) - parseFloat(parentCs.paddingRight);
        const lineCs = getComputedStyle(line);
        const pad = isWordmark ? 0 : parseFloat(lineCs.paddingLeft) - parseFloat(lineCs.paddingRight);
        const avail = box - Math.max(0, pad);
        const w = inner.scrollWidth;
        const size = parseFloat(lineCs.fontSize);
        if (isWordmark) {
          line.style.fontSize = size * (avail / w) * 0.995 + 'px';
        } else if (w > avail) {
          line.style.fontSize = Math.floor(size * (avail / w) * 0.98) + 'px';
        }
      });
    }

    /* ---------- 3b. Reveals ---------- */
    const revealTargets = document.querySelectorAll('.split, [data-reveal]');
    if ('IntersectionObserver' in window && !reduceMotion) {
      const io = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
      );
      revealTargets.forEach(el => io.observe(el));
      observers.push(io);
    } else {
      revealTargets.forEach(el => el.classList.add('in'));
    }

    document.fonts.ready.then(() => {
      if (signal.aborted) return;
      fitLines();
      // hero headline plays on load rather than waiting for intersection
      document.querySelector('.hero h1')?.classList.add('in');
    });
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    window.addEventListener(
      'resize',
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(fitLines, 150);
      },
      { signal },
    );

    /* ---------- 3c. Scroll choreography ---------- */
    const nav = document.querySelector<HTMLElement>('.nav');
    const releaseStage = document.querySelector<HTMLElement>('.release-stage');
    const releaseArt = document.querySelector<HTMLElement>('.release-art');
    const parallaxEls = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
    const marqueeAnim = document.querySelector('.marquee-track')?.getAnimations?.()[0];

    let lastY = window.scrollY;
    let velocity = 0;
    let ticking = false;

    function onScroll() {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      nav?.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : '0');

      // hide nav while travelling down, reveal on the way up
      const dy = y - lastY;
      if (y > window.innerHeight * 0.6 && dy > 4) body.classList.add('nav-hidden');
      else if (dy < -4 || y < 120) body.classList.remove('nav-hidden');
      velocity = dy;
      lastY = y;

      if (!reduceMotion) {
        // record slides out of the sleeve as the release scrolls through view
        if (releaseStage && releaseArt) {
          const r = releaseStage.getBoundingClientRect();
          const vh = window.innerHeight;
          const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.55 + r.height * 0.5)));
          const eased = 1 - Math.pow(1 - p, 3);
          releaseStage.style.setProperty('--p', eased.toFixed(4));
          releaseArt.style.setProperty('--p', eased.toFixed(4));
        }
        parallaxEls.forEach(el => {
          const k = parseFloat(el.dataset.parallax ?? '') || 0;
          el.style.transform = `translate3d(0, ${(y * k).toFixed(1)}px, 0) rotate(${(y * 0.04).toFixed(2)}deg)`;
        });
      }
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          raf(onScroll);
        }
      },
      { passive: true, signal },
    );
    onScroll();

    /* marquee speeds up with scroll velocity, then settles */
    if (marqueeAnim && !reduceMotion) {
      let rate = 1;
      const tick = () => {
        const target = 1 + Math.min(5, Math.abs(velocity) * 0.12);
        rate += (target - rate) * 0.08;
        velocity *= 0.9;
        marqueeAnim.playbackRate = rate;
        raf(tick);
      };
      tick();
    }

    /* ---------- 3d. Pointer micro-interactions ---------- */
    if (finePointer && !reduceMotion) {
      document.querySelectorAll<HTMLElement>('.magnetic').forEach(el => {
        el.addEventListener(
          'pointermove',
          e => {
            const r = el.getBoundingClientRect();
            const x = e.clientX - (r.left + r.width / 2);
            const y = e.clientY - (r.top + r.height / 2);
            el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
          },
          { signal },
        );
        el.addEventListener('pointerleave', () => (el.style.transform = ''), { signal });
      });

      const glow = experience?.querySelector<HTMLElement>('.nebula i:nth-child(2)');
      if (experience && glow) {
        experience.addEventListener(
          'pointermove',
          e => {
            const r = experience.getBoundingClientRect();
            glow.style.setProperty('--nx', ((e.clientX - r.left) / r.width - 0.4) * 40 + 'vw');
            glow.style.setProperty('--ny', ((e.clientY - r.top) / r.height - 0.55) * 50 + 'vh');
          },
          { signal },
        );
      }
    }

    return () => {
      ac.abort();
      observers.forEach(o => o.disconnect());
      frames.forEach(id => cancelAnimationFrame(id));
      clearTimeout(resizeTimer);
      body.classList.remove('menu-open', 'overlay-open', 'nav-hidden', 'mini-on');
    };
  }, [pathname]);

  return null;
}
