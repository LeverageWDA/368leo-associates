/* 368 Leoz Entertainment: page changes without reloading, so music keeps playing.
   Each page (index, music, videos, artists, about) is a complete HTML file and works
   on its own. When a visitor clicks a link to another page, this fetches that page,
   swaps in its <main> and title, and leaves the header, footer and players alone.
   If anything goes wrong it falls back to a normal page load. */

(function () {
  if (!window.fetch || !window.history?.pushState || !window.DOMParser) return;

  const PAGE = /^\/(?:(?:index|music|videos|artists|about|contact)(?:\.html)?)?$/;
  let busy = false;
  const norm = p => p.replace(/(index)?(\.html)?$/, '').replace(/\/$/, '');
  let currentPage = norm(location.pathname);

  function isPageLink(a, e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (a.target && a.target !== '_self') return false;
    if (a.hasAttribute('download') || a.getAttribute('aria-disabled') === 'true') return false;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    return PAGE.test(url.pathname.replace(/\/$/, '') || '/');
  }

  const samePage = url => norm(url.pathname) === currentPage;

  function scrollToHash(hash) {
    const el = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) el.scrollIntoView();
    else window.scrollTo(0, 0);
  }

  async function go(url, push) {
    if (busy) return;
    busy = true;
    const main = document.querySelector('main');
    try {
      const res = await fetch(url.pathname, { headers: { 'X-Requested-With': 'leoz-router' } });
      if (!res.ok) throw new Error(res.status);
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const next = doc.querySelector('main');
      if (!next) throw new Error('no main');

      window.LeozPlayer?.unmount(main);
      main.classList.add('is-leaving');
      await new Promise(r => setTimeout(r, 160));

      main.replaceWith(next);
      document.title = doc.title;
      const desc = doc.querySelector('meta[name="description"]')?.content;
      if (desc) document.querySelector('meta[name="description"]')?.setAttribute('content', desc);

      if (push) history.pushState({}, '', new URL(res.url).pathname + url.hash);
      currentPage = norm(location.pathname);
      window.LeozSite?.closeMenu();
      document.body.classList.remove('nav-hidden');
      scrollToHash(url.hash);

      window.LeozPlayer?.mount(next);
      window.LeozSite?.initPage(next);
      next.classList.add('is-entering');
      requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove('is-entering')));

      // move focus to the new page's heading for keyboard and screen-reader users
      const h1 = next.querySelector('h1');
      if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    } catch (err) {
      location.href = url.href;
    } finally {
      busy = false;
    }
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || !isPageLink(a, e)) return;
    const url = new URL(a.href, location.href);
    if (samePage(url)) {
      if (url.hash) return;            // in-page anchor: let the browser scroll
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    e.preventDefault();
    go(url, true);
  });

  window.addEventListener('popstate', () => {
    const url = new URL(location.href);
    if (norm(url.pathname) === currentPage) { if (url.hash) scrollToHash(url.hash); return; }
    go(url, false);
  });
})();
