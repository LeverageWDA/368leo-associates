/* Leo & Associates — interactions
   1. Mobile menu (unchanged behaviour)
   2. Player overlay + mini player (unchanged behaviour, focus fix)
   3. Choreography: line reveals, scroll-linked art, marquee velocity,
      nav progress / auto-hide, magnetic buttons, nebula pointer drift */

document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- 1. Mobile menu ---------- */
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

function setMenu(open) {
  mobileMenu.classList.toggle('active', open);
  menuToggle.classList.toggle('active', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileMenu.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('menu-open', open);
}
function closeMenu() { setMenu(false); }
menuToggle.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('active')));
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

/* ---------- 2. Player overlay ---------- */
const overlay = document.getElementById('playerOverlay');
const closeBtn = document.getElementById('closePlayer');
let previousFocus = null;

function openPlayer() {
  previousFocus = document.activeElement;
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('overlay-open');
  // wait a frame so the dialog is visible before moving focus into it
  requestAnimationFrame(() => requestAnimationFrame(() => closeBtn.focus()));
}
function closePlayer() {
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('overlay-open');
  previousFocus?.focus();
}
document.getElementById('openPlayer').addEventListener('click', openPlayer);
document.getElementById('expandPlayer').addEventListener('click', openPlayer);
closeBtn.addEventListener('click', closePlayer);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (overlay.classList.contains('active')) closePlayer();
    else closeMenu();
  }
  if (e.key === 'Tab' && overlay.classList.contains('active')) {
    const focusables = [...overlay.querySelectorAll('button:not([disabled]),a[href]')];
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* mini player appears once the listening room has scrolled past */
const mini = document.getElementById('miniPlayer');
const experience = document.getElementById('experience');
new IntersectionObserver(entries => {
  for (const entry of entries) {
    const on = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    mini.classList.toggle('visible', on);
    document.body.classList.toggle('mini-on', on);
  }
}, { threshold: 0 }).observe(experience);
/* park it while the footer is on screen so it never covers footer links */
new IntersectionObserver(([entry]) => mini.classList.toggle('parked', entry.isIntersecting), { threshold: 0 })
  .observe(document.querySelector('.footer'));

/* ---------- 3a. Fit guard: no display line may overflow its column ---------- */
function fitLines() {
  document.querySelectorAll('.split .line, .footer-wordmark').forEach(line => {
    line.style.fontSize = '';
    const inner = line.classList.contains('footer-wordmark') ? line : line.firstElementChild;
    if (!inner) return;
    const parentCs = getComputedStyle(line.parentElement);
    const box = line.parentElement.clientWidth - parseFloat(parentCs.paddingLeft) - parseFloat(parentCs.paddingRight);
    const pad = line.classList.contains('footer-wordmark') ? 0 : parseFloat(getComputedStyle(line).paddingLeft) - parseFloat(getComputedStyle(line).paddingRight);
    const avail = box - Math.max(0, pad);
    const w = inner.scrollWidth;
    if (line.classList.contains('footer-wordmark')) {
      const size = parseFloat(getComputedStyle(line).fontSize);
      line.style.fontSize = (size * (avail / w) * 0.995) + 'px';
    } else if (w > avail) {
      const size = parseFloat(getComputedStyle(line).fontSize);
      line.style.fontSize = Math.floor(size * (avail / w) * 0.98) + 'px';
    }
  });
}

/* ---------- 3b. Reveals ---------- */
const revealTargets = document.querySelectorAll('.split, [data-reveal]');
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  revealTargets.forEach(el => io.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('in'));
}

const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
fontsReady.then(() => {
  fitLines();
  // hero headline plays on load rather than waiting for intersection
  document.querySelector('.hero h1')?.classList.add('in');
});
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fitLines, 150); });

/* ---------- 3c. Scroll choreography ---------- */
const nav = document.querySelector('.nav');
const releaseStage = document.querySelector('.release-stage');
const releaseArt = document.querySelector('.release-art');
const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
const marqueeAnim = document.querySelector('.marquee-track')?.getAnimations?.()[0];

let lastY = window.scrollY;
let velocity = 0;
let ticking = false;

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  nav.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);

  // hide nav while travelling down, reveal on the way up
  const dy = y - lastY;
  if (y > window.innerHeight * .6 && dy > 4) document.body.classList.add('nav-hidden');
  else if (dy < -4 || y < 120) document.body.classList.remove('nav-hidden');
  velocity = dy;
  lastY = y;

  if (!reduceMotion) {
    // record slides out of the sleeve as the release scrolls through view
    if (releaseStage) {
      const r = releaseStage.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * .55 + r.height * .5)));
      const eased = 1 - Math.pow(1 - p, 3);
      releaseStage.style.setProperty('--p', eased.toFixed(4));
      releaseArt.style.setProperty('--p', eased.toFixed(4));
    }
    parallaxEls.forEach(el => {
      const k = parseFloat(el.dataset.parallax) || 0;
      el.style.transform = `translate3d(0, ${(y * k).toFixed(1)}px, 0) rotate(${(y * .04).toFixed(2)}deg)`;
    });
  }
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

/* marquee speeds up with scroll velocity, then settles */
if (marqueeAnim && !reduceMotion) {
  let rate = 1;
  (function tick() {
    const target = 1 + Math.min(5, Math.abs(velocity) * .12);
    rate += (target - rate) * .08;
    velocity *= .9;
    marqueeAnim.playbackRate = rate;
    requestAnimationFrame(tick);
  })();
}

/* ---------- 3d. Pointer micro-interactions ---------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * .3}px, ${y * .3}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  const glow = experience.querySelector('.nebula i:nth-child(2)');
  experience.addEventListener('pointermove', e => {
    const r = experience.getBoundingClientRect();
    glow.style.setProperty('--nx', ((e.clientX - r.left) / r.width - .4) * 40 + 'vw');
    glow.style.setProperty('--ny', ((e.clientY - r.top) / r.height - .55) * 50 + 'vh');
  });
}
