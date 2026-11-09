/* 368 Leoz Entertainment — interactions
   Runs once:    mobile menu, player overlay, mini player, nav progress, marquee speed
   Runs per page (first load and after router.js swaps a page):
                 line reveals, fit guard, scroll-linked art, magnetic buttons, nebula drift */

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
  requestAnimationFrame(() => requestAnimationFrame(() => closeBtn.focus()));
}
function closePlayer() {
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('overlay-open');
  previousFocus?.focus();
}
document.addEventListener('click', e => { if (e.target.closest('[data-open-player]')) openPlayer(); });
document.getElementById('expandPlayer').addEventListener('click', openPlayer);
closeBtn.addEventListener('click', closePlayer);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (overlay.classList.contains('active')) closePlayer();
    else closeMenu();
  }
  if (e.key === 'Tab' && overlay.classList.contains('active')) {
    const focusables = [...overlay.querySelectorAll('button:not([disabled]),a[href],input')].filter(el => el.offsetParent !== null);
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- 3. Mini player: shows once a song has started, unless the
   page's own listening room is on screen; parks over the footer ---------- */
const mini = document.getElementById('miniPlayer');
let roomVisible = false;
let footerVisible = false;
function updateMini() {
  const on = (window.LeozPlayer?.hasTrack || false) && !roomVisible;
  mini.classList.toggle('visible', on);
  mini.classList.toggle('parked', footerVisible);
  document.body.classList.toggle('mini-on', on);
}
new IntersectionObserver(([entry]) => { footerVisible = entry.isIntersecting; updateMini(); }, { threshold: 0 })
  .observe(document.querySelector('.footer'));
const roomObserver = new IntersectionObserver(entries => {
  for (const entry of entries) roomVisible = entry.isIntersecting;
  updateMini();
}, { threshold: .25 });
new MutationObserver(updateMini).observe(document.body, { attributes: true, attributeFilter: ['class'] });

/* ---------- 4. Fit guard: no display line may overflow its column ---------- */
function fitLines(root = document) {
  root.querySelectorAll('.split .line').forEach(line => {
    line.style.fontSize = '';
    const inner = line.firstElementChild;
    if (!inner) return;
    const parentCs = getComputedStyle(line.parentElement);
    const box = line.parentElement.clientWidth - parseFloat(parentCs.paddingLeft) - parseFloat(parentCs.paddingRight);
    const pad = parseFloat(getComputedStyle(line).paddingLeft) - parseFloat(getComputedStyle(line).paddingRight);
    const avail = box - Math.max(0, pad);
    const w = inner.scrollWidth;
    if (w > avail) {
      const size = parseFloat(getComputedStyle(line).fontSize);
      line.style.fontSize = Math.floor(size * (avail / w) * 0.98) + 'px';
    }
  });
}
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => fitLines(), 150); });

/* ---------- 5. Scroll choreography (page parts are re-bound on every page) ---------- */
const nav = document.querySelector('.nav');
let releaseStage = null, releaseArt = null, parallaxEls = [], marqueeAnim = null;
let lastY = window.scrollY, velocity = 0, ticking = false;

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  nav.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);

  const dy = y - lastY;
  if (y > window.innerHeight * .6 && dy > 4) document.body.classList.add('nav-hidden');
  else if (dy < -4 || y < 120) document.body.classList.remove('nav-hidden');
  velocity = dy;
  lastY = y;

  if (!reduceMotion) {
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

/* marquee speeds up with scroll velocity, then settles */
if (!reduceMotion) {
  let rate = 1;
  (function tick() {
    const target = 1 + Math.min(5, Math.abs(velocity) * .12);
    rate += (target - rate) * .08;
    velocity *= .9;
    if (marqueeAnim) marqueeAnim.playbackRate = rate;
    requestAnimationFrame(tick);
  })();
}

/* ---------- 6. Nav: mark the current page ---------- */
function pageName(path) {
  const m = path.match(/\/(music|videos|artists|about|contact)(\.html)?\/?$/);
  return m ? m[1] : 'home';
}
function markNav() {
  const here = pageName(location.pathname);
  document.querySelectorAll('.desktop-nav a, .mobile-menu a[data-page]').forEach(a => {
    const same = a.dataset.page === here;
    a.classList.toggle('is-active', same);
    if (same) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

/* ---------- 7. Social links (footer once, Contact page per page) ---------- */
const SOCIAL = (window.LEOZ_CATALOG || {}).social || {};
const NETWORKS = [
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
  ['youtube', 'YouTube'],
  ['spotify', 'Spotify'],
];
const ICON_CDN = 'https://cdn.jsdelivr.net/npm/simple-icons@13.0.0/icons/';
const MAIL_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M3 5.5h18v13H3z M3.5 6l8.5 7 8.5-7"/></svg>';
const escAttr = v => String(v).replace(/[&"<>]/g, c => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }[c]));
const handleOf = url => { try { const seg = new URL(url).pathname.split('/').filter(Boolean)[0] || ''; return seg ? (seg.startsWith('@') ? seg : '@' + seg) : ''; } catch { return ''; } };
const SHORT = { instagram: 'IG', tiktok: 'TT', youtube: 'YT', spotify: 'SP' };
// If the icon can't load, the button falls back to short text (IG, TT, YT, SP)
const icon = key => key === 'email' ? MAIL_ICON :
  `<img src="${ICON_CDN}${key}.svg" alt="" width="20" height="20" loading="lazy" onerror="this.parentNode.classList.add('no-icon');this.remove()" /><span class="ico-fallback" aria-hidden="true">${SHORT[key]}</span>`;

function renderSocial(root) {
  const links = NETWORKS.filter(([k]) => SOCIAL[k]);
  root.querySelectorAll('[data-socials]').forEach(box => {
    box.innerHTML = links.map(([k, name]) =>
      `<a class="social-btn" href="${escAttr(SOCIAL[k])}" target="_blank" rel="noopener" aria-label="${name}" title="${name}">${icon(k)}</a>`).join('') +
      (SOCIAL.email ? `<a class="social-btn" href="mailto:${escAttr(SOCIAL.email)}" aria-label="Email" title="Email">${icon('email')}</a>` : '');
  });
  root.querySelectorAll('[data-social-cards]').forEach(box => {
    box.innerHTML = links.map(([k, name]) =>
      `<a class="contact-card" href="${escAttr(SOCIAL[k])}" target="_blank" rel="noopener"><span class="contact-card-label"><b class="social-ico">${icon(k)}</b>${name.toUpperCase()}</span><strong>${escAttr(k === 'spotify' ? 'Listen on Spotify' : handleOf(SOCIAL[k]))}</strong><i aria-hidden="true">↗</i></a>`).join('');
  });
}
renderSocial(document.querySelector('.footer'));

/* ---------- 8. Per-page setup ---------- */
let revealObserver = null;
function initPage(root) {
  markNav();

  const targets = root.querySelectorAll('.split, [data-reveal]');
  revealObserver?.disconnect();
  if ('IntersectionObserver' in window && !reduceMotion) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => revealObserver.observe(el));
  } else {
    targets.forEach(el => el.classList.add('in'));
  }

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    fitLines(root);
    root.querySelector('.hero h1, .page-hero h1')?.classList.add('in');
  });

  releaseStage = root.querySelector('.release-stage');
  releaseArt = root.querySelector('.release-art');
  parallaxEls = [...root.querySelectorAll('[data-parallax]')];
  marqueeAnim = root.querySelector('.marquee-track')?.getAnimations?.()[0] || null;

  roomObserver.disconnect();
  roomVisible = false;
  const room = root.querySelector('.player-cover');
  if (room) roomObserver.observe(room);
  updateMini();

  if (finePointer && !reduceMotion) {
    root.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * .3}px, ${(e.clientY - (r.top + r.height / 2)) * .3}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    const experience = root.querySelector('.experience');
    const glow = experience?.querySelector('.nebula i:nth-child(2)');
    if (glow) {
      experience.addEventListener('pointermove', e => {
        const r = experience.getBoundingClientRect();
        glow.style.setProperty('--nx', ((e.clientX - r.left) / r.width - .4) * 40 + 'vw');
        glow.style.setProperty('--ny', ((e.clientY - r.top) / r.height - .55) * 50 + 'vh');
      });
    }
  }

  renderSocial(root);

  const form = root.querySelector('#contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = new FormData(form);
      const subject = `${d.get('topic')}: message from ${d.get('name')}`;
      const body = `${d.get('message')}\n\n${d.get('name')}`;
      location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  lastY = window.scrollY;
  onScroll();
}

window.LeozSite = { initPage, closeMenu };
initPage(document.querySelector('main'));
