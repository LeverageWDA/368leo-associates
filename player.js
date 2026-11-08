/* 368 Leoz Entertainment: listening room, mini player and music video.
   Music streams in the page only. There is no download button, no link to
   the audio files, and the browser's own download/save menus are turned off
   on the player. (See README: no website can make audio impossible to record.) */

(function () {
  const C = window.LEOZ_CATALOG || {};
  const release = C.release || {};
  const tracks = (C.tracks || []).filter(t => t && t.file && t.title);
  const video = C.video || {};
  const CREST = 'assets/brand/368leoz-crest.png';
  const $ = id => document.getElementById(id);

  /* ---------- Block save / download shortcuts on media and artwork ---------- */
  const protectedSel = 'img, video, audio, .player-cover, .release-art, .video-frame, .player-overlay, .mini-player';
  document.addEventListener('contextmenu', e => { if (e.target.closest(protectedSel)) e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (e.target.closest(protectedSel)) e.preventDefault(); });

  /* ---------- Release details ---------- */
  const cover = release.cover || (tracks[0] && tracks[0].cover) || '';
  if (release.title) $('releaseTitle').textContent = release.title.toUpperCase();
  if (release.artist) $('releaseArtist').textContent = release.artist.toUpperCase();
  if (release.description) $('releaseDesc').textContent = release.description;
  if (tracks.length) $('releaseCount').textContent = tracks.length + (tracks.length === 1 ? ' TRACK' : ' TRACKS');
  if (cover) {
    const art = $('releaseArt');
    art.classList.add('has-cover');
    art.style.setProperty('--cover', `url("${cover}")`);
  }

  /* ---------- Audio engine (never placed in the page, no native controls) ---------- */
  const audio = new Audio();
  audio.preload = 'none';
  audio.controls = false;
  audio.setAttribute('controlsList', 'nodownload noplaybackrate');
  audio.disableRemotePlayback = true;

  let current = -1;
  const list = $('trackList');
  const fmt = s => (!isFinite(s) || s < 0) ? '0:00' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function renderList() {
    list.innerHTML = '';
    if (!tracks.length) {
      list.innerHTML =
        '<li class="track-row is-empty"><span class="track-index">01—</span><div><strong>New music coming soon</strong><p>Tracks will appear here as soon as they are added.</p></div><span class="track-symbol">✳</span></li>' +
        '<li class="track-row is-empty"><span class="track-index">02—</span><div><strong>Streaming only</strong><p>Listen right here on the site. Downloads are not offered.</p></div><span class="track-symbol">↗</span></li>';
      $('trackCountLabel').textContent = 'COMING SOON';
      return;
    }
    $('trackCountLabel').textContent = `${tracks.length} ${tracks.length === 1 ? 'TRACK' : 'TRACKS'} / STREAM ONLY`;
    tracks.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = 'track-row';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'track-btn';
      btn.setAttribute('aria-label', `Play ${t.title}`);
      btn.innerHTML = `<span class="track-index">${String(i + 1).padStart(2, '0')}—</span><div><strong></strong><p></p></div><span class="track-symbol" aria-hidden="true">▶</span>`;
      btn.querySelector('strong').textContent = t.title;
      btn.querySelector('p').textContent = t.artist || release.artist || '368 Leoz Entertainment';
      btn.addEventListener('click', () => (i === current ? toggle() : play(i)));
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function setArt(src) {
    const s = src || cover || CREST;
    $('coverImg').src = s;
    $('miniArt').src = s;
    $('overlayArt').src = src || cover || 'assets/brand/368leoz-logo-on-dark.png';
    $('coverImg').classList.toggle('is-cover', Boolean(src || cover));
    $('overlayArt').classList.toggle('is-cover', Boolean(src || cover));
  }

  function load(i) {
    current = (i + tracks.length) % tracks.length;
    const t = tracks[current];
    audio.src = t.file;
    setArt(t.cover);
    $('overlayKicker').textContent = (t.artist || release.artist || '368 Leoz Entertainment').toUpperCase();
    $('overlayTitle').innerHTML = '';
    const em = document.createElement('em'); em.textContent = t.title;
    $('overlayTitle').appendChild(em);
    $('overlayExplainer').textContent = `Track ${current + 1} of ${tracks.length}`;
    $('miniTitle').textContent = t.title;
    $('miniSub').textContent = t.artist || release.artist || '368 Leoz Entertainment';
    list.querySelectorAll('.track-row').forEach((r, n) => r.classList.toggle('is-current', n === current));
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title, artist: t.artist || release.artist || '368 Leoz Entertainment',
        album: release.title || '368 Leoz Entertainment',
        artwork: [{ src: t.cover || cover || CREST }]
      });
    }
  }

  function play(i) {
    if (!tracks.length) return;
    if (typeof i === 'number' && i !== current) load(i);
    else if (current < 0) load(0);
    audio.play().catch(() => {});
  }
  function toggle() { audio.paused ? play() : audio.pause(); }

  function syncState() {
    const playing = !audio.paused;
    document.body.classList.toggle('is-playing', playing);
    $('overlayDisc').classList.toggle('spin', playing);
    for (const b of [$('playBtn'), $('miniToggle')]) {
      b.textContent = playing ? '❚❚' : '▶';
      b.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    }
    $('coverStatus').innerHTML = `<i></i>${playing ? 'NOW PLAYING' : (current >= 0 ? 'PAUSED' : 'READY')}`;
    list.querySelectorAll('.track-row').forEach((r, n) => {
      const sym = r.querySelector('.track-symbol');
      if (sym && tracks.length) sym.textContent = (n === current && playing) ? '❚❚' : '▶';
    });
  }

  if (tracks.length) {
    $('transport').hidden = false;
    $('overlayTitle').innerHTML = 'PRESS<br /><em>PLAY.</em>';
    $('overlayExplainer').textContent = `${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'} ready to stream.`;
    $('playBtn').addEventListener('click', toggle);
    $('miniToggle').addEventListener('click', toggle);
    $('prevBtn').addEventListener('click', () => (audio.currentTime > 3 ? (audio.currentTime = 0) : play(current - 1)));
    $('nextBtn').addEventListener('click', () => play(current + 1));
    audio.addEventListener('ended', () => (current < tracks.length - 1 ? play(current + 1) : syncState()));
    ['play', 'pause', 'ended'].forEach(ev => audio.addEventListener(ev, syncState));
    audio.addEventListener('error', () => {
      $('overlayExplainer').textContent = 'This track could not be loaded. Please try another.';
    });

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

  renderList();
  setArt('');
  syncState();

  /* ---------- Music video ---------- */
  const frame = $('videoFrame');
  const ytId = (() => {
    const m = String(video.youtube || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : '';
  })();

  if (video.file) {
    const v = document.createElement('video');
    v.src = video.file;
    v.controls = true;
    v.playsInline = true;
    v.preload = 'metadata';
    v.disablePictureInPicture = true;
    v.disableRemotePlayback = true;
    v.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback');
    if (video.poster) v.poster = video.poster;
    v.setAttribute('aria-label', video.title || 'Official music video');
    v.addEventListener('play', () => audio.pause());
    frame.innerHTML = '';
    frame.appendChild(v);
  } else if (ytId) {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`;
    f.title = video.title || 'Official music video';
    f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    f.allowFullscreen = true;
    f.loading = 'lazy';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.innerHTML = '';
    frame.appendChild(f);
  }
  if (video.title && (video.file || ytId)) $('videoCaption').textContent = video.title;
})();
