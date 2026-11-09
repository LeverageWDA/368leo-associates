# 368 Leoz Entertainment

Official website for 368 Leoz Entertainment. *Music is the voice.*

## Run locally

```bash
python3 -m http.server 3000
```

Then visit http://localhost:3000.

## Pages

| Page | File | What's on it |
|---|---|---|
| Home | `index.html` | Hero, featured release, listening room (first 6 tracks, "Show all"), video, links |
| Music | `music.html` | Every track in a scrolling list |
| Videos | `videos.html` | Music video(s) |
| Artists | `artists.html` | One card per artist, built automatically from `catalog.js` |
| About | `about.html` | The story, plus contact and socials |

Moving between pages doesn't reload the site (`router.js`), so a song keeps playing.
The header, footer and players are the same on every page: if you change them, change all five files.

## Adding songs, cover art and the music video

1. Copy the files into the `media` folder:
   - `media/audio/`: songs (`.mp3` or `.m4a`)
   - `media/covers/`: cover art (`.jpg` or `.png`, square works best)
   - `media/video/`: the music video (`.mp4`). A YouTube link can be used instead.
   - Files can also live in Cloudflare R2: use their full public links in `catalog.js`.
2. Open `catalog.js` and list them. File names must match exactly, including capital letters.
3. Reload the page. The tracklist, player, release sleeve and video update automatically.
   Anything left empty shows a "coming soon" state.

Use web-sized files, not masters: about 128–192 kbps MP3 for audio and a 1080p MP4 under ~100 MB for video.

## Listening without downloading

Visitors can play music on the site, but the site offers no way to download it:

- no download buttons and no links to the audio files
- the audio plays through a hidden player with the browser's own controls turned off
- the video player has its download, picture-in-picture and casting options turned off
- right-click and drag-to-save are blocked on the players and artwork
- `robots.txt` and the `vercel.json` headers keep `/media/` out of search engines

**Limits:** these measures stop casual downloading only. Anything a browser can play can be
captured by someone determined (for example by recording the sound, or using developer
tools to find the file address). To protect masters, only upload web-quality versions, or use
a short preview clip. For stronger protection, stream through a service with signed, expiring
links (for example Mux or Cloudflare Stream) or embed from YouTube, SoundCloud or Audiomack.

## Brand

- Logo files are in `assets/brand/`:
  - `368leoz-logo.png`: full logo for light backgrounds
  - `368leoz-logo-on-dark.png`: brightened version for dark backgrounds
  - `368leoz-crest.png` and `368leoz-crest-on-dark.png`: crest only
  - `favicon.png` and `apple-touch-icon.png`: browser icons
- Colours: light `#f7f6f2`, ink `#111110`, gold `#d4af37`, bright gold `#ffd700`.
- Type: Space Grotesk (display), Instrument Serif italic (accents), DM Sans (body), DM Mono (labels).
  Fonts are self-hosted in `fonts/`.

## Still to supply

1. Songs, cover art and the music video (see above).
2. Apple Music and store links.
3. The approved "About" text, social links and contact email.
