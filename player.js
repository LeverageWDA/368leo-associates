/* 368 Leoz Entertainment: music engine, mini player, tracklists, artists and video.
   The audio engine lives for the whole visit. Pages are swapped by router.js
   without reloading, so a song keeps playing while people move around the site.

   Music streams in the page only: there is no download button, no link to the
   audio files, and the browser's own download/save menus are turned off on the
   players. (See README: no website can make audio impossible to record.) */

(function () {
  const C = window.LEOZ_CATALOG || {};
  const release = C.release || {};
  const LABEL = '368 Leoz Entertainment';
  const CREST = 'assets/brand/368leoz-crest.png';
  const LOGO_DARK = 'assets/brand/368leoz-logo-on-dark.png';
  const tracks = (C.tracks || []).filter(t => t && t.file && t.title);
  const videos = (Array.isArray(C.videos) ? C.videos : [C.video]).filter(v => v && (v.file || v.youtube));
  const releaseCover = release.cover || '';
  const artistOf = t => (t && t.artist) || LABEL;
  const $ = id => document.getElementById(id);
  const fmt = s => (!isFinite(s) || s < 0) ? '0:00' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Block save / download shortcuts on media and artwork ---------- */
  const protectedSel = 'img, video, audio, .player-cover, .release-art, .video-frame, .player-overlay, .mini-player, .artist-card';
  document.addEventListener('contextmenu', e => { if (e.target.closest(protectedSel)) e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (e.target.closest(protectedSel)) e.preventDefault(); });

  /* ---------- Audio engine (never placed in the page, no native controls) ---------- */
  const audio = new Audio();
  audio.preload = 'none';
  audio.controls = false;
  audio.setAttribute('controlsList', 'nodownload noplaybackrate');
  audio.disableRemotePlayback = true;
  let current = -1;

  function art(t) { return (t && t.cover) || releaseCover; }

  function load(i) {
    current = (i + tracks.length) % tracks.length;
    const t = tracks[current];
    audio.src = t.file;
    $('overlayKicker').textContent = artistOf(t).toUpperCase();
    $('overlayTitle').innerHTML = `<em>${esc(t.title)}</em>`;
    $('overlayExplainer').textContent = `Track ${current + 1} of ${tracks.length}`;
    $('miniTitle').textContent = t.title;
    $('miniSub').textContent = artistOf(t);
    const a = art(t);
    $('miniArt').src = a || CREST;
    $('overlayArt').src = a || LOGO_DARK;
    $('overlayArt').classList.toggle('is-cover', Boolean(a));
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title, artist: artistOf(t), album: release.title || LABEL,
        artwork: [{ src: new URL(a || CREST, location.href).href }]
      });
    }
    sync();
  }

  function play(i) {
    if (!tracks.length) return;
    if (typeof i === 'number' && i !== current) load(i);
    else if (current < 0) load(0);
    audio.play().catch(() => {});
  }
  function toggle() { audio.paused ? play() : audio.pause(); }

  /* Reflect state everywhere: mini player, overlay, every tracklist, every cover */
  function sync() {
    const playing = !audio.paused;
    document.body.classList.toggle('is-playing', playing);
    document.body.classList.toggle('has-track', current >= 0);
    $('overlayDisc').classList.toggle('spin', playing);
    for (const b of [$('playBtn'), $('miniToggle')]) {
      b.textContent = playing ? '❚❚' : '▶';
      b.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    }
    document.querySelectorAll('[data-track]').forEach(btn => {
      const n = Number(btn.dataset.track);
      const on = n === current;
      btn.closest('.track-row').classList.toggle('is-current', on);
      btn.querySelector('.track-symbol').textContent = on && playing ? '❚❚' : '▶';
      btn.setAttribute('aria-label', `${on && playing ? 'Pause' : 'Play'} ${tracks[n].title}`);
    });
    document.querySelectorAll('[data-cover]').forEach(img => {
      const a = current >= 0 ? art(tracks[current]) : releaseCover;
      img.src = a || CREST;
      img.classList.toggle('is-cover', Boolean(a));
    });
    document.querySelectorAll('[data-cover-status]').forEach(el => {
      el.innerHTML = `<i></i>${playing ? 'NOW PLAYING' : (current >= 0 ? 'PAUSED' : 'READY')}`;
    });
    document.querySelectorAll('[data-play-artist]').forEach(b => {
      const mine = current >= 0 && artistOf(tracks[current]) === b.dataset.playArtist;
      b.classList.toggle('is-current', mine && playing);
      b.querySelector('b').textContent = mine && playing ? 'PAUSE' : 'PLAY';
    });
  }

  /* ---------- Persistent controls (overlay + mini player) ---------- */
  if (tracks.length) {
    $('transport').hidden = false;
    $('overlayTitle').innerHTML = 'PRESS<br /><em>PLAY.</em>';
    $('overlayExplainer').textContent = `${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'} ready to stream.`;
    $('playBtn').addEventListener('click', toggle);
    $('miniToggle').addEventListener('click', toggle);
    $('prevBtn').addEventListener('click', () => (audio.currentTime > 3 ? (audio.currentTime = 0) : play(current - 1)));
    $('nextBtn').addEventListener('click', () => play(current + 1));
    audio.addEventListener('ended', () => (current < tracks.length - 1 ? play(current + 1) : sync()));
    ['play', 'pause', 'ended'].forEach(ev => audio.addEventListener(ev, sync));
    audio.addEventListener('error', () => { $('overlayExplainer').textContent = 'This track could not be loaded. Please try another.'; });

    const seek = $('seekBar');
    let dragging = false;
    seek.addEventListener('input', () => { dragging = true; $('timeNow').textContent = fmt(seek.value / 1000 * audio.duration); });
    seek.addEventListener('change', () => { if (isFinite(audio.duration)) audio.currentTime = seek.value / 1000 * audio.duration; dragging = false; });
    audio.addEventListener('timeupdate', () => {
      if (!dragging && isFinite(audio.duration)) seek.value = Math.round(audio.currentTime / audio.duration * 1000);
      if (!dragging) $('timeNow').textContent = fmt(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', () => { $('timeTotal').textContent = fmt(audio.duration); });

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => play(current - 1));
      navigator.mediaSession.setActionHandler('nexttrack', () => play(current + 1));
    }
  } else {
    $('miniToggle').hidden = true;
  }

  /* One delegated click handler covers every tracklist and artist button on every page */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-track]');
    if (t) { const n = Number(t.dataset.track); n === current ? toggle() : play(n); return; }
    const a = e.target.closest('[data-play-artist]');
    if (a) {
      const name = a.dataset.playArtist;
      if (current >= 0 && artistOf(tracks[current]) === name) { toggle(); return; }
      const first = tracks.findIndex(x => artistOf(x) === name);
      if (first >= 0) play(first);
      return;
    }
    const more = e.target.closest('[data-show-all]');
    if (more) {
      const list = document.getElementById(more.getAttribute('aria-controls'));
      const open = !list.classList.contains('expanded');
      list.classList.toggle('expanded', open);
      more.setAttribute('aria-expanded', String(open));
      more.querySelector('b').textContent = open ? 'SHOW FEWER' : `SHOW ALL ${list.dataset.total} TRACKS`;
      if (!open) list.scrollTop = 0;
    }
  });

  /* ---------- Page rendering (runs on first load and after every page swap) ---------- */
  function rowHTML(t, i) {
    return `<li class="track-row"><button type="button" class="track-btn" data-track="${i}">` +
      `<span class="track-index">${String(i + 1).padStart(2, '0')}—</span>` +
      `<div><strong>${esc(t.title)}</strong><p>${esc(artistOf(t))}</p></div>` +
      `<span class="track-symbol" aria-hidden="true">▶</span></button></li>`;
  }

  function renderTracklists(root) {
    root.querySelectorAll('[data-tracklist]').forEach((list, k) => {
      const filter = list.dataset.artist;
      const items = tracks.map((t, i) => [t, i]).filter(([t]) => !filter || artistOf(t) === filter);
      const counter = list.closest('.track-panel')?.querySelector('[data-track-count]');
      if (!items.length) {
        list.innerHTML =
          '<li class="track-row is-empty"><span class="track-index">01—</span><div><strong>New music coming soon</strong><p>Tracks will appear here as soon as they are added.</p></div><span class="track-symbol">✳</span></li>' +
          '<li class="track-row is-empty"><span class="track-index">02—</span><div><strong>Streaming only</strong><p>Listen right here on the site. Downloads are not offered.</p></div><span class="track-symbol">↗</span></li>';
        if (counter) counter.textContent = 'COMING SOON';
        return;
      }
      list.innerHTML = items.map(([t, i]) => rowHTML(t, i)).join('');
      if (counter) counter.textContent = `${items.length} ${items.length === 1 ? 'TRACK' : 'TRACKS'} / STREAM ONLY`;
      const limit = Number(list.dataset.limit) || 0;
      if (limit && items.length > limit) {
        [...list.children].forEach((li, n) => li.classList.toggle('is-extra', n >= limit));
        list.id = list.id || `tracklist-${k}`;
        list.dataset.total = items.length;
        list.style.setProperty('--limit', limit);
        list.classList.add('is-limited');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'show-all';
        btn.dataset.showAll = '';
        btn.setAttribute('aria-controls', list.id);
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = `<b>SHOW ALL ${items.length} TRACKS</b> <span aria-hidden="true">↓</span>`;
        list.after(btn);
      }
    });
  }

  function renderArtists(root) {
    const grid = root.querySelector('[data-artists]');
    if (!grid) return;
    const groups = new Map();
    tracks.forEach((t, i) => {
      const name = artistOf(t);
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push([t, i]);
    });
    if (!groups.size) {
      grid.innerHTML = '<p class="artists-empty">Artists will appear here once music is added.</p>';
      return;
    }
    grid.innerHTML = [...groups].map(([name, items]) => {
      const cover = items.map(([t]) => t.cover).find(Boolean);
      const id = 'artist-' + slug(name);
      return `<article class="artist-card" id="${id}" data-reveal>
        <div class="artist-art${cover ? ' has-cover' : ''}">
          <img src="${esc(cover || CREST)}" alt="" loading="lazy" draggable="false" />
        </div>
        <div class="artist-body">
          <div class="artist-head">
            <div><h3>${esc(name)}</h3><span>${items.length} ${items.length === 1 ? 'TRACK' : 'TRACKS'}</span></div>
            <button type="button" class="artist-play" data-play-artist="${esc(name)}" aria-label="Play ${esc(name)}"><b>PLAY</b> <span aria-hidden="true">▶</span></button>
          </div>
          <ol class="track-list track-list-compact">${items.map(([t, i]) => rowHTML(t, i)).join('')}</ol>
        </div>
      </article>`;
    }).join('');
    const count = root.querySelector('[data-artist-count]');
    if (count) count.textContent = `${groups.size} ARTISTS / ${tracks.length} TRACKS`;
  }

  function renderRelease(root) {
    const set = (sel, v) => { const el = root.querySelector(sel); if (el && v) el.textContent = v; };
    set('[data-release-title]', release.title && release.title.toUpperCase());
    set('[data-release-artist]', release.artist && release.artist.toUpperCase());
    set('[data-release-desc]', release.description);
    set('[data-release-count]', tracks.length ? `${tracks.length} ${tracks.length === 1 ? 'TRACK' : 'TRACKS'}` : '');
    const art = root.querySelector('.release-art');
    if (art && releaseCover) {
      art.classList.add('has-cover');
      art.style.setProperty('--cover', `url("${releaseCover}")`);
    }
  }

  function renderVideos(root) {
    root.querySelectorAll('[data-video]').forEach(frame => {
      const v = videos[Number(frame.dataset.video) || 0];
      const caption = frame.parentElement.querySelector('[data-video-caption]');
      if (!v) return;
      const ytId = (String(v.youtube || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];
      frame.innerHTML = '';
      if (v.file) {
        const el = document.createElement('video');
        el.src = v.file;
        el.controls = true;
        el.playsInline = true;
        el.preload = 'metadata';
        el.disablePictureInPicture = true;
        el.disableRemotePlayback = true;
        el.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback');
        if (v.poster) el.poster = v.poster;
        el.setAttribute('aria-label', v.title || 'Official music video');
        el.addEventListener('play', () => audio.pause());
        frame.appendChild(el);
      } else if (ytId) {
        const f = document.createElement('iframe');
        f.src = `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`;
        f.title = v.title || 'Official music video';
        f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
        f.allowFullscreen = true;
        f.loading = 'lazy';
        f.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.appendChild(f);
      }
      if (caption && v.title) caption.textContent = v.title;
    });
  }

  function mount(root) {
    renderRelease(root);
    renderTracklists(root);
    renderArtists(root);
    renderVideos(root);
    sync();
  }

  /* Pause any page video before it is swapped out */
  function unmount(root) { root.querySelectorAll('video').forEach(v => v.pause()); }

  window.LeozPlayer = { mount, unmount, get hasTrack() { return current >= 0; } };
  mount(document.querySelector('main'));
})();
